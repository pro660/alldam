import fs from "fs";
import path from "path";

const rootDir = process.cwd();
const boundaryDir = path.join(rootDir, "public", "data", "boundaries");

const boundarySettings = {
  sigungu: {
    input: path.join(boundaryDir, "raw-sigungu.json"),
    output: path.join(boundaryDir, "sigungu.json"),
    tolerance: 0.0012,
  },
  eupmyeondong: {
    input: path.join(boundaryDir, "raw-eupmyeondong.json"),
    output: path.join(boundaryDir, "eupmyeondong.json"),
    tolerance: 0.0008,
  },
};

function getSqDistance(point, start, end) {
  const x = point[0];
  const y = point[1];
  let dx = end[0] - start[0];
  let dy = end[1] - start[1];

  if (dx !== 0 || dy !== 0) {
    const t = ((x - start[0]) * dx + (y - start[1]) * dy) / (dx * dx + dy * dy);

    if (t > 1) {
      dx = x - end[0];
      dy = y - end[1];
    } else if (t > 0) {
      dx = x - (start[0] + dx * t);
      dy = y - (start[1] + dy * t);
    } else {
      dx = x - start[0];
      dy = y - start[1];
    }
  } else {
    dx = x - start[0];
    dy = y - start[1];
  }

  return dx * dx + dy * dy;
}

function simplifyDouglasPeucker(points, sqTolerance) {
  const last = points.length - 1;
  const markers = new Uint8Array(points.length);
  const stack = [[0, last]];
  const result = [];

  markers[0] = 1;
  markers[last] = 1;

  while (stack.length) {
    const [first, end] = stack.pop();
    let maxSqDistance = 0;
    let index = 0;

    for (let i = first + 1; i < end; i += 1) {
      const sqDistance = getSqDistance(points[i], points[first], points[end]);

      if (sqDistance > maxSqDistance) {
        index = i;
        maxSqDistance = sqDistance;
      }
    }

    if (maxSqDistance > sqTolerance) {
      markers[index] = 1;
      stack.push([first, index], [index, end]);
    }
  }

  for (let i = 0; i < points.length; i += 1) {
    if (markers[i]) {
      result.push(points[i]);
    }
  }

  return result;
}

function isClosedRing(ring) {
  if (ring.length < 2) return false;

  const first = ring[0];
  const last = ring[ring.length - 1];

  return first[0] === last[0] && first[1] === last[1];
}

function simplifyRing(ring, tolerance) {
  if (ring.length <= 5) return ring;

  const closed = isClosedRing(ring);
  const sourceRing = closed ? ring.slice(0, -1) : ring;

  if (sourceRing.length <= 4) return ring;

  const simplified = simplifyDouglasPeucker(sourceRing, tolerance * tolerance);

  if (simplified.length < 4) return ring;

  if (!closed) return simplified;

  const first = simplified[0];
  const last = simplified[simplified.length - 1];

  if (first[0] === last[0] && first[1] === last[1]) {
    return simplified;
  }

  return [...simplified, first];
}

function countPoints(geoJson) {
  let points = 0;

  for (const feature of geoJson.features || []) {
    const geometry = feature.geometry;
    if (!geometry) continue;

    if (geometry.type === "Polygon") {
      for (const ring of geometry.coordinates) {
        points += ring.length;
      }
    }

    if (geometry.type === "MultiPolygon") {
      for (const polygon of geometry.coordinates) {
        for (const ring of polygon) {
          points += ring.length;
        }
      }
    }
  }

  return points;
}

function simplifyGeometry(geometry, tolerance) {
  if (!geometry) return geometry;

  if (geometry.type === "Polygon") {
    return {
      ...geometry,
      coordinates: geometry.coordinates.map((ring) => simplifyRing(ring, tolerance)),
    };
  }

  if (geometry.type === "MultiPolygon") {
    return {
      ...geometry,
      coordinates: geometry.coordinates.map((polygon) => {
        return polygon.map((ring) => simplifyRing(ring, tolerance));
      }),
    };
  }

  return geometry;
}

function simplifyBoundary(boundaryType) {
  const setting = boundarySettings[boundaryType];
  const source = JSON.parse(fs.readFileSync(setting.input, "utf-8"));
  const beforePoints = countPoints(source);

  const result = {
    ...source,
    features: (source.features || []).map((feature) => {
      return {
        ...feature,
        geometry: simplifyGeometry(feature.geometry, setting.tolerance),
      };
    }),
  };

  const afterPoints = countPoints(result);

  fs.writeFileSync(setting.output, JSON.stringify(result), "utf-8");

  console.log(
    `[${boundaryType}] ${beforePoints.toLocaleString()} -> ${afterPoints.toLocaleString()} points`
  );
  console.log(`-> ${setting.output}`);
}

simplifyBoundary("sigungu");
simplifyBoundary("eupmyeondong");
