import { describe, it, expect, beforeEach } from 'vitest';
import { useHourglassStore } from '../useHourglassStore';
import type { Member } from '../../types';

describe('useHourglassStore', () => {
  const members: Record<string, Member> = {
    '1': { id: '1', firstName: '子傑', lastName: '魏', gender: 'male', type: 'member' } as any,
    '2': { id: '2', firstName: '小明', lastName: '王', gender: 'male', type: 'member' } as any,
    '3': { id: '3', firstName: '小華', lastName: '林', gender: 'female', type: 'member' } as any
  };

  beforeEach(() => {
    useHourglassStore.setState({
      homeMemberId: null,
      focusId: null,
      history: [],
      ancestorDepth: 3,
      descendantDepth: 3,
      collapsedOverride: {},
      expandedOverride: {}
    });
  });

  it('resolveInitial sets homeMemberId by name', () => {
    useHourglassStore.getState().resolveInitial(members, '魏子傑');
    const state = useHourglassStore.getState();
    expect(state.homeMemberId).toBe('1');
    expect(state.focusId).toBe('1');
  });

  it('setFocus adds to history and does not add duplicates consecutively', () => {
    const store = useHourglassStore.getState();
    store.setFocus('1');
    store.setFocus('2');
    store.setFocus('2'); // duplicate
    store.setFocus('3');

    const state = useHourglassStore.getState();
    expect(state.focusId).toBe('3');
    expect(state.history).toEqual(['1', '2']);
  });

  it('goBack pops history', () => {
    const store = useHourglassStore.getState();
    store.setFocus('1');
    store.setFocus('2');
    store.setFocus('3');
    
    useHourglassStore.getState().goBack();
    let state = useHourglassStore.getState();
    expect(state.focusId).toBe('2');
    expect(state.history).toEqual(['1']);

    useHourglassStore.getState().goBack();
    state = useHourglassStore.getState();
    expect(state.focusId).toBe('1');
    expect(state.history).toEqual([]);
  });

  it('jumpTo truncates history', () => {
    const store = useHourglassStore.getState();
    store.setFocus('1');
    store.setFocus('2');
    store.setFocus('3');
    store.setFocus('4');

    useHourglassStore.getState().jumpTo(1);
    const state = useHourglassStore.getState();
    expect(state.focusId).toBe('2');
    expect(state.history).toEqual(['1']);
  });

  it('resetToHome clears overrides', () => {
    const store = useHourglassStore.getState();
    store.setHome('1');
    store.setFocus('2');
    store.toggleDescendants('node1', false);

    useHourglassStore.getState().resetToHome();
    const state = useHourglassStore.getState();
    expect(state.focusId).toBe('1');
    expect(state.collapsedOverride).toEqual({});
    expect(state.expandedOverride).toEqual({});
    expect(state.history).toEqual([]);
  });

  it('validateFocus falls back to home or null if focus is missing', () => {
    const store = useHourglassStore.getState();
    store.setHome('1');
    store.setFocus('99'); // invalid

    useHourglassStore.getState().validateFocus(members);
    expect(useHourglassStore.getState().focusId).toBe('1');
  });

  it('history limits to 12 items', () => {
    const store = useHourglassStore.getState();
    for (let i = 1; i <= 15; i++) {
      store.setFocus(`id${i}`);
    }
    const state = useHourglassStore.getState();
    expect(state.history.length).toBe(12);
    expect(state.history[0]).toBe('id3');
    expect(state.focusId).toBe('id15');
  });
});
