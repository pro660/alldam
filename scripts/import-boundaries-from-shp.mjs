import fs from "fs";
import path from "path";
import { TextDecoder } from "util";
import { spawnSync } from "child_process";

const rootDir = process.cwd();
const outputDir = path.join(rootDir, "public", "data", "boundaries");

const sources = {
  sigungu: {
    shp: "C:/Users/gw904/Downloads/BND_SIGUNGU_PG/BND_SIGUNGU_PG.shp",
    dbf: "C:/Users/gw904/Downloads/BND_SIGUNGU_PG/BND_SIGUNGU_PG.dbf",
    encoding: "euc-kr",
  },
  eupmyeondong: {
    shp: "C:/Users/gw904/Downloads/LSMD_ADM_SECT_UMD_충남/LSMD_ADM_SECT_UMD_44_202604.shp",
    dbf: "C:/Users/gw904/Downloads/LSMD_ADM_SECT_UMD_충남/LSMD_ADM_SECT_UMD_44_202604.dbf",
    encoding: "euc-kr",
  },
};

const targetRegions = [
  { region: "서산", fullName: "서산시", codePrefix: "44210" },
  { region: "당진", fullName: "당진시", codePrefix: "44270" },
  { region: "홍성", fullName: "홍성군", codePrefix: "44800" },
  { region: "예산", fullName: "예산군", codePrefix: "44810" },
];

const decoderCache = new Map();

function getDecoder(encoding) {
  if (!decoderCache.has(encoding)) {
    decoderCache.set(encoding, new TextDecoder(encoding));
  }

  return decoderCache.get(encoding);
}

function decodeField(buffer, encoding) {
  return getDecoder(encoding)
    .decode(buffer)
    .replace(/\0/g, "")
    .trim();
}

function readDbf(filePath, encoding) {
  const buffer = fs.readFileSync(filePath);
  const recordCount = buffer.readUInt32LE(4);
  const headerLength = buffer.readUInt16LE(8);
  const recordLength = buffer.readUInt16LE(10);
  const fields = [];

  for (let offset = 32; offset < headerLength - 1; offset += 32) {
    const name = buffer
      .subarray(offset, offset + 11)
      .toString("ascii")
      .replace(/\0.*$/, "");

    if (!name) break;

    fields.push({
      name,
      type: String.fromCharCode(buffer[offset + 11]),
      length: buffer[offset + 16],
      decimal: buffer[offset + 17],
    });
  }

  const records = [];

  for (let index = 0; index < recordCount; index += 1) {
    const recordOffset = headerLength + index * recordLength;
    const deleted = String.fromCharCode(buffer[recordOffset]) === "*";

    if (deleted) {
      records.push(null);
      continue;
    }

    let fieldOffset = recordOffset + 1;
    const record = {};

    for (const field of fields) {
      const rawValue = buffer.subarray(fieldOffset, fieldOffset + field.length);
      const value = decodeField(rawValue, encoding);
      record[field.name] = value;
      fieldOffset += field.length;
    }

    records.push(record);
  }

  return records;
}

function inverseEpsg5186(x, y) {
  const a = 6378137;
  const f = 1 / 298.257222101;
  const e2 = 2 * f - f * f;
  const ep2 = e2 / (1 - e2);
  const x0 = 200000;
  const y0 = 600000;
  const k0 = 1;
  const lat0 = (38 * Math.PI) / 180;
  const lon0 = (127 * Math.PI) / 180;

  const m0 =
    a *
    ((1 - e2 / 4 - (3 * e2 ** 2) / 64 - (5 * e2 ** 3) / 256) * lat0 -
      ((3 * e2) / 8 + (3 * e2 ** 2) / 32 + (45 * e2 ** 3) / 1024) *
        Math.sin(2 * lat0) +
      ((15 * e2 ** 2) / 256 + (45 * e2 ** 3) / 1024) * Math.sin(4 * lat0) -
      ((35 * e2 ** 3) / 3072) * Math.sin(6 * lat0));

  const m = m0 + (y - y0) / k0;
  const mu = m / (a * (1 - e2 / 4 - (3 * e2 ** 2) / 64 - (5 * e2 ** 3) / 256));
  const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));

  const fp =
    mu +
    ((3 * e1) / 2 - (27 * e1 ** 3) / 32) * Math.sin(2 * mu) +
    ((21 * e1 ** 2) / 16 - (55 * e1 ** 4) / 32) * Math.sin(4 * mu) +
    ((151 * e1 ** 3) / 96) * Math.sin(6 * mu) +
    ((1097 * e1 ** 4) / 512) * Math.sin(8 * mu);

  const sinFp = Math.sin(fp);
  const cosFp = Math.cos(fp);
  const tanFp = Math.tan(fp);
  const c1 = ep2 * cosFp ** 2;
  const t1 = tanFp ** 2;
  const n1 = a / Math.sqrt(1 - e2 * sinFp ** 2);
  const r1 = (a * (1 - e2)) / (1 - e2 * sinFp ** 2) ** 1.5;
  const d = (x - x0) / (n1 * k0);

  const lat =
    fp -
    ((n1 * tanFp) / r1) *
      (d ** 2 / 2 -
        ((5 + 3 * t1 + 10 * c1 - 4 * c1 ** 2 - 9 * ep2) * d ** 4) / 24 +
        ((61 + 90 * t1 + 298 * c1 + 45 * t1 ** 2 - 252 * ep2 - 3 * c1 ** 2) *
          d ** 6) /
          720);

  const lon =
    lon0 +
    (d -
      ((1 + 2 * t1 + c1) * d ** 3) / 6 +
      ((5 - 2 * c1 + 28 * t1 - 3 * c1 ** 2 + 8 * ep2 + 24 * t1 ** 2) *
        d ** 5) /
        120) /
      cosFp;

  return [(lon * 180) / Math.PI, (lat * 180) / Math.PI];
}

function readPolygonShp(filePath) {
  const buffer = fs.readFileSync(filePath);
  const features = [];
  let offset = 100;

  while (offset < buffer.length) {
    const contentLength = buffer.readInt32BE(offset + 4) * 2;
    const contentOffset = offset + 8;
    const shapeType = buffer.readInt32LE(contentOffset);

    if (shapeType === 0) {
      features.push(null);
      offset = contentOffset + contentLength;
      continue;
    }

    if (shapeType !== 5 && shapeType !== 15) {
      throw new Error(`지원하지 않는 SHP 타입입니다: ${shapeType}`);
    }

    const numParts = buffer.readInt32LE(contentOffset + 36);
    const numPoints = buffer.readInt32LE(contentOffset + 40);
    const partsOffset = contentOffset + 44;
    const pointsOffset = partsOffset + numParts * 4;
    const partStarts = [];

    for (let index = 0; index < numParts; index += 1) {
      partStarts.push(buffer.readInt32LE(partsOffset + index * 4));
    }

    const points = [];

    for (let index = 0; index < numPoints; index += 1) {
      const pointOffset = pointsOffset + index * 16;
      points.push([
        buffer.readDoubleLE(pointOffset),
        buffer.readDoubleLE(pointOffset + 8),
      ]);
    }

    const rings = partStarts.map((start, index) => {
      const end = partStarts[index + 1] ?? points.length;
      return points.slice(start, end).map(([x, y]) => inverseEpsg5186(x, y));
    });

    features.push(rings);
    offset = contentOffset + contentLength;
  }

  return features;
}

function getTargetByCode(code) {
  return targetRegions.find((target) => code.startsWith(target.codePrefix));
}

function getTargetByName(name) {
  return targetRegions.find((target) => name.includes(target.fullName));
}

function toFeatureCollection(boundaryType, records, geometries) {
  const features = [];

  records.forEach((record, index) => {
    if (!record || !geometries[index]) return;

    const code =
      boundaryType === "sigungu" ? record.SIGUNGU_CD : record.EMD_CD || "";
    const name =
      boundaryType === "sigungu" ? record.SIGUNGU_NM : record.EMD_NM || "";
    const target =
      boundaryType === "sigungu"
        ? getTargetByName(name) || getTargetByCode(code)
        : getTargetByCode(code);

    if (!target) return;

    const coordinates = geometries[index].map((ring) => [ring]);

    features.push({
      type: "Feature",
      properties: {
        ...record,
        region: target.region,
        sigunguName: target.fullName,
        displayName: boundaryType === "sigungu" ? target.fullName : name,
        boundaryCode: code,
      },
      geometry: {
        type: "MultiPolygon",
        coordinates,
      },
    });
  });

  return {
    type: "FeatureCollection",
    features,
  };
}

function writeBoundary(boundaryType) {
  const source = sources[boundaryType];
  const records = readDbf(source.dbf, source.encoding);
  const geometries = readPolygonShp(source.shp);
  const collection = toFeatureCollection(boundaryType, records, geometries);
  const outputFile = path.join(outputDir, `${boundaryType}.json`);
  const rawOutputFile = path.join(outputDir, `raw-${boundaryType}.json`);

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputFile, JSON.stringify(collection), "utf-8");
  fs.writeFileSync(rawOutputFile, JSON.stringify(collection), "utf-8");

  console.log(
    `[${boundaryType}] ${records.length}개 중 ${collection.features.length}개 저장 완료`
  );
  console.log(`-> ${outputFile}`);
}

writeBoundary("sigungu");
writeBoundary("eupmyeondong");

const simplifyResult = spawnSync(
  process.execPath,
  [path.join("scripts", "simplify-boundaries.mjs")],
  {
    cwd: rootDir,
    stdio: "inherit",
  }
);

if (simplifyResult.status !== 0) {
  process.exit(simplifyResult.status ?? 1);
}
