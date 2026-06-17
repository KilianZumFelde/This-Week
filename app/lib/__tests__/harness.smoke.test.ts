// Smoke test — confirms the jest + ts harness runs at all.
// Replace/expand with real unit tests (cursor position, etc.) as phases land.
describe('test harness', () => {
  it('runs TypeScript tests', () => {
    expect(1 + 1).toBe(2);
  });
});
