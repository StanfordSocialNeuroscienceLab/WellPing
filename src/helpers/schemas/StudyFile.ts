import * as z from "zod";

const idRegexCheck = (val: string) => /^\w+$/.test(val);
const idRegexErrorMessage = (name: string) =>
  `${name} can only include letters, numbers, and "_".`;

export const StudyIdSchema = z.string().refine(idRegexCheck, {
  message: idRegexErrorMessage("Study ID"),
});

export const StreamNameSchema = z.string().refine(idRegexCheck, {
  message: idRegexErrorMessage("Stream name"),
});

export const QuestionIdSchema = z.string().refine(idRegexCheck, {
  message: idRegexErrorMessage("Question ID"),
});

export const WeekStartsOnSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
]);

export const QuestionTypeSchema = z.enum([
  "Slider",
  "ChoicesWithSingleAnswer",
  "ChoicesWithMultipleAnswers",
  "YesNo",
  "MultipleText",
  "HowLongAgo",
  "Branch",
  "BranchWithRelativeComparison",
]);

export const QuestionSchema = z.object({
  id: QuestionIdSchema,
  type: QuestionTypeSchema,
  question: z.string(),
  next: QuestionIdSchema.nullable(),
});

export const SliderQuestionSchema = QuestionSchema.extend({
  type: z.literal(QuestionTypeSchema.enum.Slider),
  slider: z.tuple([z.string(), z.string()]), // [left, right]
  defaultValue: z.number().int().nonnegative().max(100).optional(),
  defaultValueFromQuestionId: QuestionIdSchema.optional(),
});

export const ChoiceSchema = z.object({
  key: z.string(),
  value: z.string(),
});

export const ChoicesQuestionSchema = QuestionSchema.extend({
  type: z.union([
    z.literal(QuestionTypeSchema.enum.ChoicesWithSingleAnswer),
    z.literal(QuestionTypeSchema.enum.ChoicesWithMultipleAnswers),
  ]),
  choices: z.array(ChoiceSchema).nonempty(),
  specialCasesStartId: z
    .intersection(
      // Record<QuestionId, QuestionId>
      z.record(QuestionIdSchema.nullable()),
      // For when the user click "Prefer not to answer" or next without option.
      z.object({ _pna: QuestionIdSchema.nullable().optional() }),
    )
    .optional(),
  randomizeChoicesOrder: z.boolean().optional(),
  randomizeExceptForChoiceIds: z.array(z.string()).optional(),
});

export const QuestionsListSchema = z.record(QuestionSchema).refine(
  (questions) => {
    for (const questionId in questions) {
      if (questionId !== questions[questionId].id) {
        return false;
      }
    }
    return true;
  },
  {
    message:
      "The key in for the question in questions list should be same as " +
      "its question ID.",
  },
);

export const StreamsSchema = z.record(QuestionsListSchema);

export const StudyInfoSchema = z
  .object({
    /**
     * The ID of the study.
     *
     * It can only include letters, numbers, and "_".
     */
    id: StudyIdSchema,

    /**
     * The server URL (including the trailing slash).
     */
    serverURL: z.string().url(),

    /**
     * The URL of the study consent form (or any web page you would want the
     * user to see before they begin).
     *
     * This web page will be displayed after the user successfully logs in.
     */
    consentFormUrl: z.string().url(),

    /**
     * The email address that the user could contact for questions regarding the
     * study or the app.
     *
     * If this field is set, a "Contact Staff" button will appear at the top of
     * the screen.
     */
    contactEmail: z.string().email().optional(),

    /**
     * The first day of the week.
     *
     * 0 is Sunday.
     */
    weekStartsOn: WeekStartsOnSchema,

    /**
     * The start date (time) of the study.
     *
     * The first ping will be sent after this time.
     */
    startDate: z.date(),

    /**
     * The end date (time) of the study.
     *
     * The last ping will be sent before this time.
     */
    endDate: z.date(),

    frequency: z.object({
      /**
       * A ping will expire after this amount of minutes (after the notification
       * time).
       *
       * For example, if the user receives a ping notification on 10:00AM, and
       * `expireAfterMinutes` is set to `45`, the user will no longer be able to
       * complete this ping after 10:45AM.
       */
      expireAfterMinutes: z.number().positive(),

      /**
       * The hours (between 0 to 23) every day that ping notifications will be
       * sent.
       *
       * Notice that the duration between every
       * `(hoursEveryday[i] + randomMinuteAddition.max)` and
       * `(hoursEveryday[i+1] + randomMinuteAddition.min)`
       * should be greater than `expireAfterMinutes` so that the user will
       * always have enough time to complete the ping no matter what time they
       * receive the ping.
       */
      hoursEveryday: z.array(z.number().min(0).max(23)),

      /**
       * Randomly add a number of minutes between `min` to `max` minutes
       * (inclusive) to the notification hour (`hoursEveryday`).
       *
       * For example, if
       * - `hoursEveryday` is `[8, 12, 16]`,
       * - `randomMinuteAddition.min` is `0`, and
       * - `randomMinuteAddition.max` is `119`,
       * then notifications will be sent at random times between
       * - 8:00AM - 9:59AM,
       * - 12:00PM - 1:59PM, and
       * - 4:00PM - 5:59PM.
       */
      randomMinuteAddition: z
        .object({
          min: z.number().nonnegative(),
          max: z.number().nonnegative(),
        })
        .refine((data) => data.max > data.min, {
          message:
            "`randomMinuteAddition.max` needs to be greater than " +
            "`randomMinuteAddition.min`.",
          path: ["min", "max"],
        }),
    }),

    /**
     * The streams that the user will fill (in this order) every day.
     *
     * For example, if `streamsOrder[0]` is `["dog", "cat", "wolf", "lynx"]`,
     * then on Sunday, if the user opens all four pings they received, they
     * will fill the "dog", "cat", "wolf", and "lynx" stream (in this order).
     * If the user only opens two pings, they will fill the "dog" and "cat"
     * stream (in this order).
     *
     * Notice the numbering here is not affected by the `weekStartsOn` option
     * above (i.e., `0` here is always Sunday).
     *
     * The number of elements each day should be equal to the number of elements
     * in `frequency.hoursEveryday` above.
     */
    streamsOrder: z.object({
      0: z.array(StreamNameSchema), // Sunday
      1: z.array(StreamNameSchema), // Monday
      2: z.array(StreamNameSchema), // Tuesday
      3: z.array(StreamNameSchema), // Wednesday
      4: z.array(StreamNameSchema), // Thursday
      5: z.array(StreamNameSchema), // Friday
      6: z.array(StreamNameSchema), // Saturday
    }),

    /**
     * The stream that the user will see if there is any error in `streamsOrder`.
     */
    streamInCaseOfError: StreamNameSchema,

    /**
     * The streams that will not be replaced by followup streams
     * (when a YesNo question's `addFollowupStream` is set).
     */
    streamsNotReplacedByFollowupStream: z.array(StreamNameSchema),

    notificationContent: z.object({
      /**
       * The default notification title and body.
       */
      default: z.object({
        title: z.string(),
        body: z.string(),
      }),

      /**
       * If set, the `bonus` content for the notification will be used until
       * the number of survey completed that week is greater than
       * `bonus.numberOfCompletionEachWeek - 1`.
       *
       * "#n_ping#" in `title` and `body` will be replaced by "5 pings" or
       * "1 ping".
       *
       * Example:
       * ```
       * bonus: {
       *    title: "You can earn bonus!",
       *    body: "You are #n_ping# away from the weekly bonus.",
       *    numberOfCompletionEachWeek: 5,
       * },
       * ```
       */
      bonus: z
        .object({
          title: z.string(),
          body: z.string(),
          numberOfCompletionEachWeek: z.number().int().positive(),
        })
        .optional(),
    }),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "`endDate` needs to be later than `startDate`.",
    path: ["startDate", "endDate"],
  })
  .refine(
    (data) => {
      for (const dayStreams of Object.values(data.streamsOrder)) {
        if (dayStreams.length !== data.frequency.hoursEveryday.length) {
          return false;
        }
      }
      return true;
    },
    {
      message:
        "The number of each day's streams in `streamsOrder` needs to be equal " +
        "to the length of `frequency.hoursEveryday`.",
      path: ["streamsOrder", "hoursEveryday"],
    },
  );

export const StudyFileSchema = z.object({
  studyInfo: StudyInfoSchema,
  meta: z.object({
    startingQuestionIds: z.record(QuestionIdSchema),
  }),
  streams: StreamsSchema,
});
