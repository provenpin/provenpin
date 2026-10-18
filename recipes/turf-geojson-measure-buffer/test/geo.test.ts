import { test } from "node:test";
import assert from "node:assert/strict";
import {
  alongLine,
  areaKm2,
  bounds,
  center,
  contains,
  distanceKm,
  unitSquare,
} from "../src/geo.ts";

function close(actual: number, expected: number, tol: number): void {
  assert.ok(
    Math.abs(actual - expected) <= tol,
    `expected ${actual} within ${tol} of ${expected}`,
  );
}

test("distance between points in kilometers", () => {
  close(distanceKm([0, 0], [0, 1]), 111.195, 0.01);
  close(distanceKm([-0.1276, 51.5074], [2.3522, 48.8566]), 343.5, 2);
});

test("polygon area in square kilometers", () => {
  close(areaKm2(unitSquare()), 12364, 5);
});

test("booleanPointInPolygon for inside and outside points", () => {
  const square = unitSquare();
  assert.equal(contains([0.5, 0.5], square), true);
  assert.equal(contains([1.5, 1.5], square), false);
});

test("bbox returns the min and max corners", () => {
  assert.deepEqual(bounds(unitSquare()), [0, 0, 1, 1]);
});

test("centroid averages multipoint coordinates", () => {
  assert.deepEqual(center([[0, 0], [2, 0], [2, 2], [0, 2]]), [1, 1]);
});

test("along a lineString at a given distance", () => {
  const p = alongLine([0, 0], [1, 0], 50);
  close(p[0], 0.44966, 0.002);
  close(p[1], 0, 1e-9);
});
