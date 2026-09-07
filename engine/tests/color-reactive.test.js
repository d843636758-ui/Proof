import test from 'node:test';
import assert from 'node:assert/strict';
import { buildFromParts, ingredients } from '../src/content/realPack.js';
import { ingredientManualFor } from '../src/content/barManual.js';

test('new visual ingredients are registered with public manuals', () => {
  for (const id of ['椰奶', '绿薄荷利口酒', '蓝橙利口酒', '蝶豆花']) {
    assert.ok(ingredients[id], id);
    assert.ok(ingredientManualFor(id)?.notes?.length, `${id} manual`);
  }
});

test('butterfly pea reports blue, purple, then pink as acid rises', () => {
  const color = (acid) => buildFromParts('test', [
    { id: '蝶豆花', volume: 60 },
    ...(acid ? [{ id: '青柠汁', volume: acid }] : [])
  ]).color;
  assert.equal(color(0), '蓝');
  assert.equal(color(15), '紫');
  assert.equal(color(45), '粉红');
});

test('new liqueurs retain alcohol and coconut milk stays nonalcoholic', () => {
  assert.equal(ingredients['椰奶'].abv, 0);
  assert.equal(ingredients['绿薄荷利口酒'].abv, 0.25);
  assert.equal(ingredients['蓝橙利口酒'].abv, 0.20);
});
