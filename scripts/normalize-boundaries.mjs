import fs from "fs";
import path from "path";

const rootDir = process.cwd();
const boundaryDir = path.join(rootDir, "public", "data", "boundaries");

const inputFiles = {
  sigungu: path.join(boundaryDir, "raw-sigungu.json"),
  eupmyeondong: path.join(boundaryDir, "raw-eupmyeondong.json"),
};

const outputFiles = {
  sigungu: path.join(boundaryDir, "sigungu.json"),
  eupmyeondong: path.join(boundaryDir, "eupmyeondong.json"),
};

const targetRegions = [
  {
    region: "서산",
    fullName: "서산시",
    codePrefix: "44210",
  },
  {
    region: "당진",
    fullName: "당진시",
    codePrefix: "44270",
  },
  {
    region: "홍성",
    fullName: "홍성군",
    codePrefix: "44800",
  },
  {
    region: "예산",
    fullName: "예산군",
    codePrefix: "44810",
  },
];

function readJson(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`파일이 없습니다: ${filePath}`);
  }

  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data), "utf-8");
}

function getStringValues(properties) {
  return Object.values(properties || {})
    .filter((value) => typeof value === "string" || typeof value === "number")
    .map(String);
}

function getPossibleCode(properties) {
  const keys = [
    "boundaryCode",
    "code",
    "SIG_CD",
    "SIGUNGU_CD",
    "SGG_CD",
    "ADM_CD",
    "adm_cd",
    "EMD_CD",
    "LAWD_CD",
    "BJD_CD",
  ];

  for (const key of keys) {
    if (properties?.[key] !== undefined && properties?.[key] !== null) {
      return String(properties[key]);
    }
  }

  return "";
}

function getPossibleName(properties) {
  const keys = [
    "displayName",
    "name",
    "SIG_KOR_NM",
    "SIGUNGU_NM",
    "SGG_NM",
    "ADM_NM",
    "adm_nm",
    "EMD_KOR_NM",
    "EMD_NM",
  ];

  for (const key of keys) {
    if (properties?.[key]) {
      return String(properties[key]);
    }
  }

  return "지역명 없음";
}

function findTargetRegion(properties) {
  const values = getStringValues(properties);
  const code = getPossibleCode(properties);

  return targetRegions.find((target) => {
    const codeMatched = code.startsWith(target.codePrefix);

    const nameMatched = values.some((value) => {
      return value.includes(target.fullName) || value.includes(target.region);
    });

    return codeMatched || nameMatched;
  });
}

function normalizeFeature(feature, boundaryType) {
  const properties = feature.properties || {};
  const target = findTargetRegion(properties);

  if (!target) return null;

  const rawName = getPossibleName(properties);
  const rawCode = getPossibleCode(properties);

  return {
    ...feature,
    properties: {
      ...properties,
      region: target.region,
      sigunguName: target.fullName,
      displayName:
        boundaryType === "sigungu"
          ? target.fullName
          : rawName === "지역명 없음"
            ? target.fullName
            : rawName,
      boundaryCode: rawCode,
    },
  };
}

function normalizeBoundary(boundaryType) {
  const inputFile = inputFiles[boundaryType];
  const outputFile = outputFiles[boundaryType];

  const source = readJson(inputFile);
  const features = Array.isArray(source.features) ? source.features : [];

  const normalizedFeatures = features
    .map((feature) => normalizeFeature(feature, boundaryType))
    .filter(Boolean);

  const result = {
    type: "FeatureCollection",
    features: normalizedFeatures,
  };

  writeJson(outputFile, result);

  console.log(
    `[${boundaryType}] ${features.length}개 중 ${normalizedFeatures.length}개 저장 완료`
  );
  console.log(`-> ${outputFile}`);
}

normalizeBoundary("sigungu");
normalizeBoundary("eupmyeondong");
