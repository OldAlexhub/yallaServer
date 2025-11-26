import axios from "axios";

const ORS_API_KEY = process.env.ORS_API_KEY; // Get from https://openrouteservice.org/

async function getRoute({ from, to, overview = "full", steps = false, annotations = false }) {
  try {
    // Use OpenRouteService if API key is available, otherwise fallback
    if (ORS_API_KEY) {
      const coords = [[from.lng, from.lat], [to.lng, to.lat]];
      const url = `https://api.openrouteservice.org/v2/directions/driving-car`;
      const resp = await axios.post(url, {
        coordinates: coords,
        format: "geojson",
        instructions: steps,
        geometry_simplify: overview === "simplified"
      }, {
        headers: {
          'Authorization': ORS_API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 10000,
      });

      if (resp.data && resp.data.features && resp.data.features.length) {
        const feature = resp.data.features[0];
        const geometry = feature.geometry;
        const properties = feature.properties;

        // Convert ORS geometry to a routing result compatible with existing consumers
        return {
          geometry: geometry.coordinates.map(coord => [coord[0], coord[1]]), // lng, lat
          legs: [{
            steps: steps ? properties.segments[0].steps.map(step => ({
              geometry: step.geometry,
              instruction: step.instruction,
              distance: step.distance,
              duration: step.duration
            })) : [],
            distance: properties.segments[0].distance,
            duration: properties.segments[0].duration,
            summary: properties.segments[0].summary || ""
          }],
          distance: properties.segments[0].distance,
          duration: properties.segments[0].duration,
          weight_name: "routability",
          weight: properties.segments[0].duration
        };
      }
      return null;
    }

    // No local routing server fallback — only use OpenRouteService. If ORS_API_KEY is not present, return null.
    console.warn("No ORS_API_KEY set — routing unavailable from backend");
    return null;
  } catch (err) {
    console.warn("Routing client error", err.message);
    return null;
  }
}

export default { getRoute };
