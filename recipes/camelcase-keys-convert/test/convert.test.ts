import { test } from "node:test";
import assert from "node:assert/strict";
import { toCamel, toPascal, convertKeysDeep } from "../src/convert.ts";

test("camelcases a snake_case string", () => {
  assert.equal(toCamel("hello_world"), "helloWorld");
});

test("camelcases a string with pascalCase option", () => {
  assert.equal(toPascal("hello_world"), "HelloWorld");
});

test("deep converts snake_case keys including nested arrays", () => {
  const input = {
    user_id: 1,
    first_name: "Ada",
    home_address: {
      zip_code: "12345",
      geo_coords: { lat_long: [1, 2] },
    },
    order_items: [
      { item_id: "a", unit_price: 10 },
      { item_id: "b", unit_price: 20 },
    ],
  };

  const expected = {
    userId: 1,
    firstName: "Ada",
    homeAddress: {
      zipCode: "12345",
      geoCoords: { latLong: [1, 2] },
    },
    orderItems: [
      { itemId: "a", unitPrice: 10 },
      { itemId: "b", unitPrice: 20 },
    ],
  };

  assert.deepEqual(convertKeysDeep(input), expected);
});

test("deep converts a top level array of objects", () => {
  const input = [{ item_id: "a" }, { item_id: "b" }];
  assert.deepEqual(convertKeysDeep(input), [{ itemId: "a" }, { itemId: "b" }]);
});
