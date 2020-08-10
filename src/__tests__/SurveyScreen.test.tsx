import React from "react";
import {
  render,
  fireEvent,
  waitFor,
  waitForElementToBeRemoved,
} from "react-native-testing-library";
import waitForExpect from "wait-for-expect";

import SurveyScreen, { SurveyScreenProps } from "../SurveyScreen";
import { getAnswerEntity } from "../entities/AnswerEntity";
import { PingEntity } from "../entities/PingEntity";
import * as HelperAnswers from "../helpers/answers";
import { QuestionType } from "../helpers/helpers";
import * as HelperPings from "../helpers/pings";
import { QuestionsList } from "../helpers/types";

const getPingEntity = ({
  id,
  notificationTime,
  startTime,
  tzOffset,
  streamName,
}: {
  id: string;
  notificationTime: Date;
  startTime: Date;
  tzOffset: number;
  streamName: string;
}): PingEntity => {
  const ping = new PingEntity();
  ping.id = id;
  ping.notificationTime = notificationTime;
  ping.startTime = startTime;
  ping.streamName = streamName;
  ping.tzOffset = tzOffset;
  return ping;
};

const TEST_PING_RAW = {
  id: "testPing",
  notificationTime: new Date(),
  startTime: new Date(),
  tzOffset: 0,
  streamName: "testStream",
};
const TEST_PING = getPingEntity(TEST_PING_RAW);

const QUESTION_TITLE_TESTID = "questionTitle";
const NEXT_BUTTON_A11YLABEL = "Next question";

/**
 * If we are not testing database here, we can mock all database-related
 * function.
 * If we don't do so, the code will be stuck on these functions.
 */
function mockDatabaseRelatedFunction() {
  // https://stackoverflow.com/a/56565849/2603230
  jest
    .spyOn(HelperAnswers, "insertAnswerAsync")
    .mockImplementation(
      async ({
        ping,
        question,
        realQuestionId,
        preferNotToAnswer,
        nextWithoutOption,
        data,
        lastUpdateDate,
      }) => {
        const answer = getAnswerEntity(question.type);
        answer.ping = ping;
        answer.questionId = realQuestionId;
        answer.preferNotToAnswer = preferNotToAnswer;
        answer.nextWithoutOption = nextWithoutOption;
        answer.data = data;
        answer.lastUpdateDate = lastUpdateDate;
        return answer;
      },
    );

  jest
    .spyOn(HelperPings, "addEndTimeToPingAsync")
    .mockImplementation(async () => {
      const newPing = {
        ...TEST_PING_RAW,
        endDate: new Date(),
      };
      return getPingEntity(newPing);
    });
}

describe("questions flow", () => {
  beforeEach(() => {
    mockDatabaseRelatedFunction();
  });

  test("non-existent startingQuestionId", async () => {
    const onFinishFn = jest.fn();

    const props: SurveyScreenProps = {
      questions: {},
      startingQuestionId: "na",
      ping: TEST_PING,
      previousState: null,
      onFinish: onFinishFn,
    };
    const { toJSON } = render(<SurveyScreen {...props} />);

    expect(JSON.stringify(toJSON())).toContain("CRITICAL ERROR");

    expect(toJSON()).toMatchSnapshot();

    expect(onFinishFn).toHaveBeenCalledTimes(0);
  });

  test("single question", async () => {
    const onFinishFn = jest.fn();

    const props: SurveyScreenProps = {
      questions: {
        howLongAgoQuestion: {
          id: "howLongAgoQuestion",
          type: QuestionType.HowLongAgo,
          question: "How long ago is it?",
          next: null,
        },
      },
      startingQuestionId: "howLongAgoQuestion",
      ping: TEST_PING,
      previousState: null,
      onFinish: onFinishFn,
    };
    const { getAllByTestId, getByTestId, getByA11yLabel, toJSON } = render(
      <SurveyScreen {...props} />,
    );

    // Wait for the question to be loaded.
    await waitFor(() => {
      return getAllByTestId(QUESTION_TITLE_TESTID).length > 0;
    });

    expect(getByTestId(QUESTION_TITLE_TESTID).props.children).toMatchSnapshot(
      "screen 1",
    );

    const nextButton = getByA11yLabel(NEXT_BUTTON_A11YLABEL);
    fireEvent.press(nextButton);

    await waitForElementToBeRemoved(() => getByTestId(QUESTION_TITLE_TESTID));

    expect(toJSON()).toMatchSnapshot("screen 2");

    await waitForExpect(() => {
      expect(onFinishFn).toHaveBeenCalledTimes(1);
    });
  });

  test("2 questions", async () => {
    const onFinishFn = jest.fn();

    const props: SurveyScreenProps = {
      questions: {
        q1: {
          id: "q1",
          type: QuestionType.HowLongAgo,
          question: "Question 1",
          next: "q2",
        },
        q2: {
          id: "q2",
          type: QuestionType.Slider,
          question: "Question 2",
          slider: ["left", "right"],
          next: null,
        },
      },
      startingQuestionId: "q1",
      ping: TEST_PING,
      previousState: null,
      onFinish: onFinishFn,
    };
    const { getAllByTestId, getByTestId, getByA11yLabel, toJSON } = render(
      <SurveyScreen {...props} />,
    );

    // Wait for the question to be loaded.
    await waitFor(() => {
      return getAllByTestId(QUESTION_TITLE_TESTID).length > 0;
    });

    let currentQuestionTitle = getByTestId(QUESTION_TITLE_TESTID).props
      .children;
    expect(currentQuestionTitle).toMatchSnapshot("screen 1");

    const nextButton = getByA11yLabel(NEXT_BUTTON_A11YLABEL);
    fireEvent.press(nextButton);

    await waitFor(() => {
      return (
        getByTestId(QUESTION_TITLE_TESTID).props.children !==
        currentQuestionTitle
      );
    });

    currentQuestionTitle = getByTestId(QUESTION_TITLE_TESTID).props.children;
    expect(currentQuestionTitle).toMatchSnapshot("screen 2");

    fireEvent.press(nextButton);

    await waitForElementToBeRemoved(() => getByTestId(QUESTION_TITLE_TESTID));

    expect(toJSON()).toMatchSnapshot("end screen");

    await waitForExpect(() => {
      expect(onFinishFn).toHaveBeenCalledTimes(1);
    });
  });

  test("50 questions", async () => {
    const onFinishFn = jest.fn();

    const questions: QuestionsList = {};
    for (let i = 1; i <= 50; i++) {
      questions[`question_${i}`] = {
        id: `question_${i}`,
        type: QuestionType.HowLongAgo,
        question: `This is the ${i}th question.`,
        next: i === 50 ? null : `question_${i + 1}`,
      };
    }

    const props: SurveyScreenProps = {
      questions,
      startingQuestionId: "question_1",
      ping: TEST_PING,
      previousState: null,
      onFinish: onFinishFn,
    };
    const { getAllByTestId, getByTestId, getByA11yLabel, toJSON } = render(
      <SurveyScreen {...props} />,
    );

    // Wait for the question to be loaded.
    await waitFor(() => {
      return getAllByTestId(QUESTION_TITLE_TESTID).length > 0;
    });

    let currentQuestionTitle = "";
    for (let i = 1; i <= 50; i++) {
      currentQuestionTitle = getByTestId(QUESTION_TITLE_TESTID).props.children;
      expect(currentQuestionTitle).toBe(`This is the ${i}th question.`);

      const nextButton = getByA11yLabel(NEXT_BUTTON_A11YLABEL);
      fireEvent.press(nextButton);

      if (i === 50) {
        break;
      }

      await waitFor(() => {
        return (
          getByTestId(QUESTION_TITLE_TESTID).props.children !==
          currentQuestionTitle
        );
      });
    }

    await waitForElementToBeRemoved(() => getByTestId(QUESTION_TITLE_TESTID));

    await waitForExpect(() => {
      expect(onFinishFn).toHaveBeenCalledTimes(1);
    });
  });
});
