import { QuestionType } from "../../../../helpers/helpers";
import { QuestionsListSchema } from "../../../../helpers/schemas/Question";

describe("QuestionsListSchema", () => {
  test("should not accept inconsistent key and id", () => {
    expect(() => {
      QuestionsListSchema.parse({
        Feel_Ideal: {
          id: "Feel_Ideal",
          type: QuestionType.HowLongAgo,
          question: "how long ago question",
          next: null,
        },
      });
    }).not.toThrowError();

    expect(() => {
      QuestionsListSchema.parse({
        NotTheSameKey: {
          id: "Feel_Ideal",
          type: QuestionType.HowLongAgo,
          question: "how long ago question",
          next: null,
        },
      });
    }).toThrowErrorMatchingSnapshot("single");

    expect(() => {
      QuestionsListSchema.parse({
        NotTheSameKey: {
          id: "Feel_Ideal",
          type: QuestionType.HowLongAgo,
          question: "how long ago question",
          next: "Feel_Current",
        },
        Feel_Current: {
          id: "Feel_Current",
          type: QuestionType.HowLongAgo,
          question: "how long ago question",
          next: "How_Are",
        },
        How_Are: {
          id: "NotId",
          type: QuestionType.HowLongAgo,
          question: "how long ago question",
          next: null,
        },
      });
    }).toThrowErrorMatchingSnapshot("multiple");
  });

  test("should not accept non-existent next", () => {
    expect(() => {
      QuestionsListSchema.parse({
        Feel_Ideal: {
          id: "Feel_Ideal",
          type: QuestionType.HowLongAgo,
          question: "how long ago question",
          next: null,
        },
      });
    }).not.toThrowError();

    expect(() => {
      QuestionsListSchema.parse({
        Feel_Ideal: {
          id: "Feel_Ideal",
          type: QuestionType.HowLongAgo,
          question: "how long ago question",
          next: "Non_Existent_Question",
        },
      });
    }).toThrowErrorMatchingSnapshot("single");

    expect(() => {
      QuestionsListSchema.parse({
        Feel_Ideal: {
          id: "Feel_Ideal",
          type: QuestionType.HowLongAgo,
          question: "how long ago question",
          next: "Non_Existent1",
        },
        Feel_Current: {
          id: "Feel_Current",
          type: QuestionType.HowLongAgo,
          question: "how long ago question",
          next: "How_Are",
        },
        How_Are: {
          id: "How_Are",
          type: QuestionType.HowLongAgo,
          question: "how long ago question",
          next: "Non_Existent2",
        },
      });
    }).toThrowErrorMatchingSnapshot("multiple");
  });
});
