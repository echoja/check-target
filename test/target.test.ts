import { assert, expect, test } from "vitest";
import { checkTarget, type IEnv, type Target } from "../src/basic.js";

// 단순 타겟 테스트
test("simple gender target check", () => {
  const target: Target = {
    type: "gender",
    value: "female",
  };

  const env: IEnv = {
    user: { gender: "female" },
  };

  expect(checkTarget(target, env)).toEqual({ type: "success" });
  expect(checkTarget(target, { user: { gender: "male" } })).toEqual({
    type: "failure",
    reason: "gender is not female",
  });
  expect(checkTarget(target, { user: {} })).toEqual({ type: "ignore" });
});

test("simple age target check", () => {
  const target: Target = {
    type: "age",
    operator: ">=",
    value: 20,
  };

  expect(checkTarget(target, { user: { age: 25 } })).toEqual({
    type: "success",
  });
  expect(checkTarget(target, { user: { age: 15 } })).toEqual({
    type: "failure",
    reason: "Age is not greater than or equal to 20",
  });
  expect(checkTarget(target, { user: {} })).toEqual({ type: "ignore" });
});

// 복합 타겟 테스트
test("group AND target check", () => {
  const target: Target = {
    type: "group",
    operator: "and",
    children: [
      { type: "age", operator: ">=", value: 20 },
      { type: "age", operator: "<", value: 30 },
      { type: "gender", value: "female" },
    ],
  };

  expect(checkTarget(target, { user: { age: 25, gender: "female" } })).toEqual({
    type: "success",
  });

  expect(checkTarget(target, { user: { age: 35, gender: "female" } })).toEqual({
    type: "failure",
    reason: "Age is not less than 30",
  });

  expect(checkTarget(target, { user: { age: 25, gender: "male" } })).toEqual({
    type: "failure",
    reason: "gender is not female",
  });
});

test("group OR target check", () => {
  const target: Target = {
    type: "group",
    operator: "or",
    children: [
      { type: "age", operator: "<", value: 20 },
      { type: "age", operator: ">=", value: 60 },
    ],
  };

  expect(checkTarget(target, { user: { age: 15 } })).toEqual({
    type: "success",
  });
  expect(checkTarget(target, { user: { age: 65 } })).toEqual({
    type: "success",
  });
  expect(checkTarget(target, { user: { age: 30 } })).toEqual({
    type: "failure",
    reason: "Age is not less than 20, Age is not greater than or equal to 60",
  });
});

// Root 타겟 테스트
test("root target check", () => {
  const target: Target = {
    type: "root",
    child: {
      type: "gender",
      value: "male",
    },
  };

  expect(checkTarget(target, { user: { gender: "male" } })).toEqual({
    type: "success",
  });
  expect(checkTarget(target, { user: { gender: "female" } })).toEqual({
    type: "failure",
    reason: "gender is not male",
  });
});

// 20대 여성 조건을 나타내는 데이터
const target20female: Target = {
  type: "root",
  child: {
    type: "group",
    operator: "and",
    children: [
      {
        type: "age",
        operator: ">=",
        value: 20,
      },
      {
        type: "age",
        operator: "<",
        value: 30,
      },
      {
        type: "gender",
        value: "female",
      },
    ],
  },
};

// 20대 여성 타겟 테스트
test("20s female target check", () => {
  expect(
    checkTarget(target20female, { user: { age: 25, gender: "female" } })
  ).toEqual({ type: "success" });

  expect(
    checkTarget(target20female, { user: { age: 19, gender: "female" } })
  ).toEqual({
    type: "failure",
    reason: "Age is not greater than or equal to 20",
  });

  expect(
    checkTarget(target20female, { user: { age: 30, gender: "female" } })
  ).toEqual({ type: "failure", reason: "Age is not less than 30" });

  expect(
    checkTarget(target20female, { user: { age: 25, gender: "male" } })
  ).toEqual({ type: "failure", reason: "gender is not female" });
});

// 엣지 케이스 테스트
test("empty group test", () => {
  const target: Target = {
    type: "group",
    operator: "and",
    children: [],
  };

  expect(checkTarget(target, { user: {} })).toEqual({ type: "ignore" });
});

test("invalid data type handling", () => {
  const ageTarget: Target = {
    type: "age",
    operator: ">=",
    value: 20,
  };

  const genderTarget: Target = {
    type: "gender",
    value: "female",
  };

  expect(checkTarget(ageTarget, { user: { age: undefined } })).toEqual({
    type: "ignore",
  });
  expect(checkTarget(genderTarget, { user: { gender: undefined } })).toEqual({
    type: "ignore",
  });
});
