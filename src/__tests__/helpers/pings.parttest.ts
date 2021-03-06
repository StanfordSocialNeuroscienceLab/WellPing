import * as DateMock from "jest-date-mock";

import { getAnswersAsync } from "../../helpers/answers";
import { getPingsListAsync } from "../../helpers/asyncStorage/pingsList";
import {
  getPingsAsync,
  getTodayPingsAsync,
  insertPingAsync,
  addEndTimeToPingAsync,
  getThisWeekPingsAsync,
  getLatestPingAsync,
  NumbersOfPingsForAllStreamNames,
  getNumbersOfPingsForAllStreamNamesAsync,
  getNumberOfPingsForStreamNameAsync,
} from "../../helpers/pings";
import { PINGS, PINGS_DICT, PINGS_STUDY_INFO } from "../data/pings";
import { mockCurrentStudyInfo } from "../helper";

// https://github.com/facebook/jest/issues/6194#issuecomment-419837314
export const pingsTest = () => {
  beforeEach(() => {
    mockCurrentStudyInfo(PINGS_STUDY_INFO);
  });

  test("insert pings and set end date", async () => {
    expect(await getPingsAsync()).toEqual([]);
    expect(await getLatestPingAsync()).toEqual(null);

    const numbersOfPingsForAllStreamNames: NumbersOfPingsForAllStreamNames = {};
    expect(await getNumbersOfPingsForAllStreamNamesAsync()).toEqual(
      numbersOfPingsForAllStreamNames,
    );

    for (let i = 0; i < PINGS.length; i++) {
      const ping = PINGS[i];

      expect(await getNumberOfPingsForStreamNameAsync(ping.streamName)).toEqual(
        numbersOfPingsForAllStreamNames[ping.streamName] || 0,
      );

      const addedPing = await insertPingAsync({
        notificationTime: ping.notificationTime,
        startTime: ping.startTime,
        streamName: ping.streamName,
      });

      const pingWithoutEndDate = {
        ...ping,
        endTime: null, // Doesn't have end time yet.
      };
      expect(addedPing).toEqual(pingWithoutEndDate);
      expect(await getPingsListAsync()).toEqual(
        PINGS.slice(0, i + 1).map((ping) => ping.id),
      );
      expect(await getLatestPingAsync()).toEqual(pingWithoutEndDate);

      if (ping.endTime) {
        const updatedEndedPing = await addEndTimeToPingAsync(
          ping.id,
          ping.endTime,
        );
        expect(updatedEndedPing).toEqual(ping);
      }
      expect(await getLatestPingAsync()).toEqual(ping);

      expect(await getPingsAsync()).toEqual(PINGS.slice(0, i + 1));

      numbersOfPingsForAllStreamNames[ping.streamName] =
        (numbersOfPingsForAllStreamNames[ping.streamName] || 0) + 1;
      expect(await getNumberOfPingsForStreamNameAsync(ping.streamName)).toEqual(
        numbersOfPingsForAllStreamNames[ping.streamName],
      );
      expect(await getNumbersOfPingsForAllStreamNamesAsync()).toEqual(
        numbersOfPingsForAllStreamNames,
      );
    }
  });

  test("set end date to non-existent ping", async () => {
    // https://github.com/facebook/jest/issues/1700
    expect(
      (async () => {
        await addEndTimeToPingAsync("_OwO_", new Date());
      })(),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"pingId _OwO_ not found in getPingsAsync."`,
    );

    // The pings data should not be changed.
    expect(await getPingsAsync()).toEqual(PINGS);
  });

  test("get today's ping", async () => {
    DateMock.advanceTo(+new Date("2010-04-30T08:08:08Z"));
    expect(await getTodayPingsAsync()).toEqual([]);

    DateMock.advanceTo(+new Date("2010-05-01T08:08:08Z"));
    expect(await getTodayPingsAsync()).toEqual([]);

    DateMock.advanceTo(+new Date("2010-05-02T08:08:08Z"));
    expect(await getTodayPingsAsync()).toEqual([]);

    DateMock.advanceTo(+new Date("2010-05-02T14:08:08Z"));
    expect(await getTodayPingsAsync()).toEqual([PINGS_DICT["cat2"]]);

    DateMock.advanceTo(+new Date("2010-05-03T08:08:08Z"));
    expect(await getTodayPingsAsync()).toEqual([]);

    DateMock.advanceTo(+new Date("2010-05-03T09:30:00Z"));
    expect(await getTodayPingsAsync()).toEqual([PINGS_DICT["cat3"]]);

    DateMock.advanceTo(+new Date("2010-05-05T08:08:08Z"));
    expect(await getTodayPingsAsync()).toEqual([]);

    DateMock.advanceTo(+new Date("2010-05-10T23:00:08Z"));
    expect(await getTodayPingsAsync()).toEqual([]);

    DateMock.advanceTo(+new Date("2010-05-10T23:59:59Z"));
    expect(await getTodayPingsAsync()).toEqual([PINGS_DICT["cat4"]]);

    DateMock.advanceTo(+new Date("2010-05-11T00:00:01Z"));
    expect(await getTodayPingsAsync()).toEqual([]);

    DateMock.advanceTo(+new Date("2011-01-01T08:08:08Z"));
    expect(await getTodayPingsAsync()).toEqual([]);

    DateMock.clear();
  });

  test("get this week's ping", async () => {
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

    DateMock.advanceTo(+new Date("2010-05-11T07:00:08Z"));
    expect(await getThisWeekPingsAsync()).toEqual([PINGS_DICT["cat4"]]);

    DateMock.advanceTo(+new Date("2010-05-11T09:00:08Z"));
    expect(await getThisWeekPingsAsync()).toEqual([
      PINGS_DICT["cat4"],
      PINGS_DICT["cat5"],
    ]);

    DateMock.advanceTo(+new Date("2010-05-12T09:00:08Z"));
    expect(await getThisWeekPingsAsync()).toEqual([
      PINGS_DICT["cat4"],
      PINGS_DICT["cat5"],
      PINGS_DICT["dog2"],
      PINGS_DICT["wolf2"],
      PINGS_DICT["lynx1"],
      PINGS_DICT["cat6"],
      PINGS_DICT["dog3"],
    ]);

    DateMock.advanceTo(+new Date("2010-05-12T17:00:08Z"));
    expect(await getThisWeekPingsAsync()).toEqual([
      PINGS_DICT["cat4"],
      PINGS_DICT["cat5"],
      PINGS_DICT["dog2"],
      PINGS_DICT["wolf2"],
      PINGS_DICT["lynx1"],
      PINGS_DICT["cat6"],
      PINGS_DICT["dog3"],
      PINGS_DICT["cat7"],
    ]);

    DateMock.advanceTo(+new Date("2010-05-16T23:59:08Z"));
    expect(await getThisWeekPingsAsync()).toEqual([
      PINGS_DICT["cat4"],
      PINGS_DICT["cat5"],
      PINGS_DICT["dog2"],
      PINGS_DICT["wolf2"],
      PINGS_DICT["lynx1"],
      PINGS_DICT["cat6"],
      PINGS_DICT["dog3"],
      PINGS_DICT["cat7"],
    ]);

    DateMock.advanceTo(+new Date("2010-05-17T01:01:08Z"));
    expect(await getThisWeekPingsAsync()).toEqual([]);

    DateMock.advanceTo(+new Date("2011-01-01T08:08:08Z"));
    expect(await getThisWeekPingsAsync()).toEqual([]);

    DateMock.clear();
  });

  test("data match", async () => {
    const allPings = await getPingsAsync();
    // A snapshot of the pings.
    expect(allPings).toMatchSnapshot("getPingsAsync");

    const allAnswers = await getAnswersAsync();
    // A snapshot of the answers.
    expect(allAnswers).toMatchSnapshot("getAnswersAsync");
  });
};
