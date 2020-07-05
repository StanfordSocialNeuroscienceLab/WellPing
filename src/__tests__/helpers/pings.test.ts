import * as DateMock from "jest-date-mock";
import { Connection } from "typeorm";

import * as ConfigFile from "../../helpers/configFiles";
import {
  getPingsAsync,
  getTodayPingsAsync,
  insertPingAsync,
  addEndTimeToPingAsync,
  getThisWeekPingsAsync,
} from "../../helpers/pings";
import {
  connectTestDatabaseAsync,
  getTestDatabaseFilename,
} from "../data/database_helper";
import { PINGS, PINGS_DICT } from "../data/pings";

let connection: Connection;
beforeAll(async () => {
  connection = await connectTestDatabaseAsync(getTestDatabaseFilename("pings"));

  // Reset database on start.
  await connection.dropDatabase();
  await connection.synchronize();
});
afterAll(async () => {
  await connection.close();
});

test("insert pings and set end date", async () => {
  for (let i = 0; i < PINGS.length; i++) {
    const ping = PINGS[i];

    const addedPing = await insertPingAsync({
      notificationTime: ping.notificationTime,
      startTime: ping.startTime,
      streamName: ping.streamName,
    });
    expect(addedPing).toEqual({
      ...ping,
      endTime: null, // Doesn't have end time yet.
    });

    if (ping.endTime) {
      const updatedEndedPing = await addEndTimeToPingAsync(
        ping.id,
        ping.endTime,
      );
      expect(updatedEndedPing).toEqual(ping);
    }

    expect(await getPingsAsync()).toEqual(PINGS.slice(0, i + 1));
  }
});

test("get today's ping", async () => {
  DateMock.advanceTo(+new Date("2010-04-30T08:08:08Z"));
  expect(await getTodayPingsAsync()).toEqual([]);

  DateMock.advanceTo(+new Date("2010-05-01T08:08:08Z"));
  expect(await getTodayPingsAsync()).toEqual([
    PINGS_DICT["cat1"],
    PINGS_DICT["dog1"],
    PINGS_DICT["wolf1"],
  ]);

  DateMock.advanceTo(+new Date("2010-05-02T08:08:08Z"));
  expect(await getTodayPingsAsync()).toEqual([PINGS_DICT["cat2"]]);

  DateMock.advanceTo(+new Date("2010-05-03T08:08:08Z"));
  expect(await getTodayPingsAsync()).toEqual([PINGS_DICT["cat3"]]);

  DateMock.advanceTo(+new Date("2010-05-05T08:08:08Z"));
  expect(await getTodayPingsAsync()).toEqual([]);

  DateMock.advanceTo(+new Date("2010-05-10T08:08:08Z"));
  expect(await getTodayPingsAsync()).toEqual([PINGS_DICT["cat4"]]);

  DateMock.advanceTo(+new Date("2011-01-01T08:08:08Z"));
  expect(await getTodayPingsAsync()).toEqual([]);

  DateMock.clear();
});

test("get this week's ping", async () => {
  // TODO: weekStartsOn IS NOT CONSIDERED HERE.

  DateMock.advanceTo(+new Date("2010-04-30T08:08:08Z"));
  expect(await getThisWeekPingsAsync()).toEqual([]);

  DateMock.advanceTo(+new Date("2010-05-01T08:08:08Z"));
  expect(await getThisWeekPingsAsync()).toEqual([]);

  DateMock.advanceTo(+new Date("2010-05-01T10:08:08Z"));
  expect(await getThisWeekPingsAsync()).toEqual([PINGS_DICT["cat1"]]);

  DateMock.advanceTo(+new Date("2010-05-01T18:08:08Z"));
  expect(await getThisWeekPingsAsync()).toEqual([
    PINGS_DICT["cat1"],
    PINGS_DICT["dog1"],
  ]);

  DateMock.advanceTo(+new Date("2010-05-01T22:08:08Z"));
  expect(await getThisWeekPingsAsync()).toEqual([
    PINGS_DICT["cat1"],
    PINGS_DICT["dog1"],
    PINGS_DICT["wolf1"],
  ]);

  DateMock.advanceTo(+new Date("2010-05-02T08:08:08Z"));
  expect(await getThisWeekPingsAsync()).toEqual([
    PINGS_DICT["cat1"],
    PINGS_DICT["dog1"],
    PINGS_DICT["wolf1"],
  ]);

  DateMock.advanceTo(+new Date("2010-05-02T15:08:08Z"));
  expect(await getThisWeekPingsAsync()).toEqual([
    PINGS_DICT["cat1"],
    PINGS_DICT["dog1"],
    PINGS_DICT["wolf1"],
    PINGS_DICT["cat2"],
  ]);

  DateMock.advanceTo(+new Date("2010-05-03T08:08:08Z"));
  expect(await getThisWeekPingsAsync()).toEqual([]);

  DateMock.advanceTo(+new Date("2010-05-03T10:08:08Z"));
  expect(await getThisWeekPingsAsync()).toEqual([PINGS_DICT["cat3"]]);

  DateMock.advanceTo(+new Date("2010-05-09T23:59:59Z"));
  expect(await getThisWeekPingsAsync()).toEqual([PINGS_DICT["cat3"]]);

  DateMock.advanceTo(+new Date("2010-05-10T00:00:01Z"));
  expect(await getThisWeekPingsAsync()).toEqual([]);

  DateMock.advanceTo(+new Date("2010-05-11T08:08:08Z"));
  expect(await getThisWeekPingsAsync()).toEqual([PINGS_DICT["cat4"]]);

  DateMock.advanceTo(+new Date("2011-01-01T08:08:08Z"));
  expect(await getThisWeekPingsAsync()).toEqual([]);

  DateMock.clear();
});
