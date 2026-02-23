import { describe, it, expect } from 'bun:test';
import { NodeCard } from './LiveMonitor';
import React from 'react';

describe('NodeCard Memoization', () => {
  it('should be wrapped in React.memo', () => {
    // React.memo components have a $$typeof property equal to Symbol.for('react.memo')
    // @ts-ignore - $$typeof is internal to React
    expect(NodeCard.$$typeof).toBe(Symbol.for('react.memo'));
  });
});
