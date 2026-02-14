import { describe, it, expect } from "bun:test";
import React from 'react';
import DataLake from '../components/DataLake';

describe('DataLake Optimization', () => {
  it('is wrapped in React.memo', () => {
    // React.memo components have $$typeof property set to Symbol.for('react.memo')
    expect(DataLake.$$typeof).toBe(Symbol.for('react.memo'));
  });
});
