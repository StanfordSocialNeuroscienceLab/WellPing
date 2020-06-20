import React from "react";
import { View, Text, TouchableOpacity, FlatList } from "react-native";

import {
  QuestionScreenProps,
  ChoicesWithMultipleAnswersAnswerChoices,
  HowLongAgoAnswerData,
} from "../helpers/answerTypes";
import { QuestionType } from "../helpers/helpers";
import { HowLongAgoQuestion } from "../helpers/types";
import { ChoiceItem } from "./ChoicesQuestionScreen";

const numberChoices: { [key: string]: string } = {
  "1": "1",
  "2": "2",
  "3": "3",
  "4": "4",
  "5": "5",
  "6": "6",
  "7": "7",
  "8": "8",
  "9": "9",
  "10": "10",
};
const unitChoices: { [key: string]: string } = {
  hours: "hours",
  days: "days",
  weeks: "weeks",
  months: "months",
};

const dictToFlatListData = (dict: { [key: string]: string }) => {
  return Object.keys(dict).map((key) => ({
    id: key,
    title: dict[key],
  }));
};

const flatListNumberChoices = dictToFlatListData(numberChoices);
const flatListUnitChoices = dictToFlatListData(unitChoices);

interface HowLongAgoQuestionScreenProps extends QuestionScreenProps {
  question: HowLongAgoQuestion;
}

const HowLongAgoQuestionScreen: React.ElementType<HowLongAgoQuestionScreenProps> = ({
  question,
  onDataChange,
  pipeInExtraMetaData,
}) => {
  const [data, setData] = React.useState<HowLongAgoAnswerData>([null, null]);

  return (
    <View style={{ flexDirection: "row" }}>
      <FlatList
        data={flatListNumberChoices}
        renderItem={({ item }) => (
          <ChoiceItem
            id={item.id}
            title={item.title}
            selected={item.id === `${data[0]}`}
            onSelect={(id) => {
              const newData: HowLongAgoAnswerData = [Number(id), data[1]];
              setData(newData);
              onDataChange(newData);
            }}
          />
        )}
        keyExtractor={(item) => item.id}
        extraData={data}
        style={{ marginRight: 5 }}
      />
      <FlatList
        data={flatListUnitChoices}
        renderItem={({ item }) => (
          <ChoiceItem
            id={item.id}
            title={item.title}
            selected={item.id === data[1]}
            onSelect={(id) => {
              const newData: HowLongAgoAnswerData = [data[0], id];
              setData(newData);
              onDataChange(newData);
            }}
          />
        )}
        keyExtractor={(item) => item.id}
        extraData={data}
        style={{ marginLeft: 5 }}
      />
    </View>
  );
};

export default HowLongAgoQuestionScreen;
