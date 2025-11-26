import bcrypt from 'bcryptjs';
import Admin from '../../models/Admin.js';
import AdminLog from '../../models/AdminLog.js';
import { fail, ok } from '../../utils/apiResponse.js';
import { normalizeEmail } from '../../utils/emailHelpers.js';

export const createAdmin = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) return fail(res, 'Missing fields', 400);
    // ensure role is valid
    if (!['superadmin','dispatcher','support','finance'].includes(role)) return fail(res, 'Invalid role', 400);

    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) return fail(res, 'Invalid email', 400);

    const existing = await Admin.findOne({ email: normalizedEmail });
    if (existing) return fail(res, 'Admin already exists', 409);

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const admin = new Admin({ name, email: normalizedEmail, passwordHash, role });
    await admin.save();

    // audit log
    const log = new AdminLog({
      admin: { id: req.admin.id, name: req.admin.email, email: req.admin.email },
      event: 'createAdmin',
      severity: 'medium',
      description: `Created admin ${normalizedEmail} with role ${role}`,
      ip: req.ip || req.headers['x-forwarded-for'] || '',
      changes: [
        { field: 'email', old: null, new: normalizedEmail },
        { field: 'role', old: null, new: role }
      ],
      metadata: { route: req.originalUrl, method: req.method }
    });
    await log.save();

    return ok(res, { data: { id: admin._id, name: admin.name, email: admin.email, role: admin.role } });
  } catch (err) {
    console.error('createAdmin error', err);
    return fail(res, 'Server error', 500);
  }
};

export const updateAdmin = async (req, res) => {
  try {
    const id = req.params.id;
    const { name, email, password, role } = req.body;
    const admin = await Admin.findById(id);
    if (!admin) return fail(res, 'Admin not found', 404);

    const changes = [];
    const normalizedEmail = email ? normalizeEmail(email) : null;
    if (email && !normalizedEmail) return fail(res, 'Invalid email', 400);

    if (name && name !== admin.name) changes.push({ field: 'name', old: admin.name, new: name });
    if (normalizedEmail && normalizedEmail !== admin.email) changes.push({ field: 'email', old: admin.email, new: normalizedEmail });
    if (role && role !== admin.role) {
      if (!['superadmin','dispatcher','support','finance'].includes(role)) return fail(res, 'Invalid role', 400);
      changes.push({ field: 'role', old: admin.role, new: role });
      admin.role = role;
    }
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      changes.push({ field: 'passwordHash', old: '***', new: '***' });
      admin.passwordHash = passwordHash;
    }
    if (name) admin.name = name;
    if (normalizedEmail) admin.email = normalizedEmail;

    await admin.save();

    const log = new AdminLog({
      admin: { id: req.admin.id, name: req.admin.email, email: req.admin.email },
      event: 'updateAdmin',
      severity: 'medium',
      description: `Updated admin ${admin.email}`,
      ip: req.ip || req.headers['x-forwarded-for'] || '',
      changes,
      metadata: { route: req.originalUrl, method: req.method }
    });
    await log.save();

    return ok(res, { data: { id: admin._id, name: admin.name, email: admin.email, role: admin.role } });
  } catch (err) {
    console.error('updateAdmin error', err);
    return fail(res, 'Server error', 500);
  }
};

export const listAdmins = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.pageSize, 10) || 20;
    const skip = (page - 1) * pageSize;

    const filter = {};
    if (req.query.search) {
      const re = new RegExp(req.query.search, 'i');
      filter.$or = [{ name: re }, { email: re }];
    }

    const total = await Admin.countDocuments(filter);
    const items = await Admin.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize).select('name email role createdAt');

    return ok(res, { data: items, pagination: { page, pageSize, total } });
  } catch (err) {
    console.error('listAdmins error', err);
    return fail(res, 'Server error', 500);
  }
};

export const getAdmin = async (req, res) => {
  try {
    const id = req.params.id;
    const admin = await Admin.findById(id).select('name email role createdAt');
    if (!admin) return fail(res, 'Admin not found', 404);
    return ok(res, { data: admin });
  } catch (err) {
    console.error('getAdmin error', err);
    return fail(res, 'Server error', 500);
  }
};

export const deleteAdmin = async (req, res) => {
  try {
    const id = req.params.id;
    const admin = await Admin.findById(id);
    if (!admin) return fail(res, 'Admin not found', 404);
    await Admin.deleteOne({ _id: id });

    const log = new AdminLog({
      admin: { id: req.admin.id, name: req.admin.email, email: req.admin.email },
      event: 'deleteAdmin',
      severity: 'high',
      description: `Deleted admin ${admin.email}`,
      ip: req.ip || req.headers['x-forwarded-for'] || '',
      changes: [{ field: 'email', old: admin.email, new: null }],
      metadata: { route: req.originalUrl, method: req.method }
    });
    await log.save();

    return ok(res, { data: { id } });
  } catch (err) {
    console.error('deleteAdmin error', err);
    return fail(res, 'Server error', 500);
  }
};

export const resetPassword = async (req, res) => {
  try {
    const id = req.params.id;
    const admin = await Admin.findById(id);
    if (!admin) return fail(res, 'Admin not found', 404);

    // generate a temporary password (6-10 chars) — for production use a stronger flow
    const temp = Math.random().toString(36).slice(-10);
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(temp, salt);
    admin.passwordHash = passwordHash;
    await admin.save();

    const log = new AdminLog({
      admin: { id: req.admin.id, name: req.admin.email, email: req.admin.email },
      event: 'resetAdminPassword',
      severity: 'high',
      description: `Reset password for ${admin.email}`,
      ip: req.ip || req.headers['x-forwarded-for'] || '',
      changes: [{ field: 'passwordHash', old: '***', new: '***' }],
      metadata: { route: req.originalUrl, method: req.method }
    });
    await log.save();

    // return the temporary password in the response (caller must deliver to user securely)
    return ok(res, { data: { id: admin._id, tempPassword: temp } });
  } catch (err) {
    console.error('resetPassword error', err);
    return fail(res, 'Server error', 500);
  }
};
