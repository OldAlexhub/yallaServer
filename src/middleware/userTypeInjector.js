export const injectCustomerUser = (req, res, next) => {
  if (!req.customer) return res.status(401).json({ error: "Customer not authenticated" });
  req.userType = "customer";
  req.userId = req.customer.id;
  next();
};

export const injectDriverUser = (req, res, next) => {
  if (!req.driver) return res.status(401).json({ error: "Driver not authenticated" });
  req.userType = "driver";
  req.userId = req.driver.id;
  next();
};

export default { injectCustomerUser, injectDriverUser };
