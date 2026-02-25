import React from 'react';
import { SidebarComponent } from '../components/Sidebar';

// Mock console to suppress any noise
console.log = () => {};
console.warn = () => {};
console.error = () => {};

const ITERATIONS = 10000;

const activeTab = 'dashboard';
const setActiveTab = () => {};
const props = { activeTab, setActiveTab };
const nextProps = { activeTab, setActiveTab }; // Same references

function shallowEqual(objA, objB) {
  if (Object.is(objA, objB)) return true;
  if (typeof objA !== 'object' || objA === null || typeof objB !== 'object' || objB === null) return false;
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);
  if (keysA.length !== keysB.length) return false;
  for (let i = 0; i < keysA.length; i++) {
    if (!Object.prototype.hasOwnProperty.call(objB, keysA[i]) || !Object.is(objA[keysA[i]], objB[keysA[i]])) {
      return false;
    }
  }
  return true;
}

console.info("Starting benchmark...");

// Measure Un-memoized Render
const startRender = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  // @ts-ignore
  SidebarComponent(props);
}
const endRender = performance.now();
const renderTime = endRender - startRender;

// Measure Memoization Overhead (Shallow Compare)
const startMemo = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  shallowEqual(props, nextProps);
}
const endMemo = performance.now();
const memoTime = endMemo - startMemo;

console.info(`Iterations: ${ITERATIONS}`);
console.info(`Un-memoized Render Time: ${renderTime.toFixed(2)}ms`);
console.info(`Memoized Check Time: ${memoTime.toFixed(2)}ms`);
console.info(`Speedup: ${(renderTime / memoTime).toFixed(2)}x`);
