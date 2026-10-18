import {
  along,
  area,
  bbox,
  booleanPointInPolygon,
  centroid,
  distance,
  lineString,
  multiPoint,
  point,
  polygon,
  type Feature,
  type Polygon,
} from "@turf/turf";

export type LatLon = [number, number];

export function distanceKm(from: LatLon, to: LatLon): number {
  return distance(point(from), point(to), { units: "kilometers" });
}

export function unitSquare(): Feature<Polygon> {
  return polygon([[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]);
}

export function areaKm2(poly: Feature<Polygon>): number {
  return area(poly) / 1_000_000;
}

export function contains(coord: LatLon, poly: Feature<Polygon>): boolean {
  return booleanPointInPolygon(point(coord), poly);
}

export function bounds(feature: Feature<Polygon>): number[] {
  return bbox(feature);
}

export function center(coords: LatLon[]): LatLon {
  const c = centroid(multiPoint(coords));
  return [c.geometry.coordinates[0], c.geometry.coordinates[1]];
}

export function alongLine(from: LatLon, to: LatLon, km: number): LatLon {
  const p = along(lineString([from, to]), km, { units: "kilometers" });
  return [p.geometry.coordinates[0], p.geometry.coordinates[1]];
}
