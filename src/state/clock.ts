import { fixtures, loadedAt } from "../testing/fixtures";

export function now(): Date {
  return fixtures.now
    ? new Date(Date.parse(fixtures.now) + Date.now() - loadedAt)
    : new Date();
}
