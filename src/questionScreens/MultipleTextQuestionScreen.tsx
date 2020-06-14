import cloneDeep from "lodash/cloneDeep";
import React from "react";
import { View, TextInput, Alert } from "react-native";

import {
  QuestionScreen,
  MultipleTextAnswerData,
  MultipleTextAnswer,
} from "../helpers/answerTypes";
import { getNamesFile } from "../helpers/configFiles";
import { withVariable } from "../helpers/helpers";
import { MultipleTextQuestion, Names } from "../helpers/types";
import SearchableDropdown from "../inc/react-native-searchable-dropdown";

const names: Names = getNamesFile();
const namesItems = names.map((name, index) => ({ id: `${index}`, name }));

interface MultipleTextQuestionScreenProps extends QuestionScreen {
  question: MultipleTextQuestion;
}

const MultipleTextQuestionScreen: React.ElementType<MultipleTextQuestionScreenProps> = ({
  question,
  onDataChange,
  allAnswers,
  setDataValidationFunction,
}) => {
  let numberOfTextFields = question.max;
  if (question.maxMinus) {
    const prevQuestionAnswer = allAnswers[
      question.maxMinus
    ] as MultipleTextAnswer;
    if (
      prevQuestionAnswer &&
      prevQuestionAnswer.data &&
      prevQuestionAnswer.data.count
    ) {
      numberOfTextFields -= prevQuestionAnswer.data.count;
    }
  }

  const initTextValues = Array(numberOfTextFields).fill("");

  const [textValues, setTextValues]: [
    string[],
    (textValues: string[]) => void,
  ] = React.useState(initTextValues);

  React.useEffect(() => {
    // Reset the slider value when the question changes.
    setTextValues(initTextValues);
  }, [question]);

  function updateName(name: string, index: number) {
    const newTextValues: string[] = cloneDeep(textValues);
    newTextValues[index] = name.trim();
    setTextValues(newTextValues);

    const nonEmptyFields = newTextValues.filter(Boolean);
    const data: MultipleTextAnswerData = {
      count: nonEmptyFields.length,
      values: {},
    };
    nonEmptyFields.forEach((value, realIndex) => {
      const eachFieldId = question.eachId.replace(
        withVariable(question.indexName),
        `${realIndex + 1}`, // we want 1-indexed
      );
      data.values[eachFieldId] = value;
    });
    onDataChange(data);
  }

  let textFieldsDropdownItems: {
    id: string;
    name: string;
  }[] = [];
  if (question.choices === "NAMES") {
    textFieldsDropdownItems = namesItems;
  } else if (question.choices) {
    textFieldsDropdownItems = question.choices.map((choice) => ({
      id: choice.key,
      name: choice.value,
    }));
  }

  const textFields: SearchableDropdown[] = [];
  const textFieldsRef: React.RefObject<TextInput>[] = [];
  for (let index = 0; index < numberOfTextFields; index++) {
    textFieldsRef.push(React.useRef<TextInput>());

    textFields.push(
      <SearchableDropdown
        key={index}
        onItemSelect={(item) => {
          updateName(item.name, index);
        }}
        containerStyle={{ padding: 5 }}
        itemStyle={{
          padding: 10,
          backgroundColor: "#F9F6EF",
          borderColor: "#bbb",
          borderWidth: 1,
        }}
        itemsContainerStyle={{ maxHeight: 100 }}
        items={textFieldsDropdownItems}
        resetValue={false}
        textInputProps={{
          ref: textFieldsRef[index],
          placeholder: question.placeholder,
          underlineColorAndroid: "transparent",
          style: {
            padding: 12,
            borderWidth: 1,
            borderColor: "#ccc",
            borderRadius: 5,
          },
          onChangeText: (text: string) => {
            updateName(text, index);
          },
          onSubmitEditing: () => {
            if (index !== numberOfTextFields - 1) {
              textFieldsRef[index + 1].current.focus();
            }
          },
          onEndEditing: (e) => {
            dataValidationFunction();
          },
        }}
        setSort={(item, searchedText) =>
          // Match exact
          item.name.toLowerCase().startsWith(searchedText.toLowerCase())
        }
        listProps={{
          nestedScrollEnabled: true,
        }}
      />,
    );
  }

  let alertDisplaying = false;
  const dataValidationFunction = () => {
    if (!question.forceChoice) {
      // If there is no `forceChoice`, the data is always valid.
      return true;
    }

    if (alertDisplaying) {
      // It means the data is valid, and an alert is still on screen.
      return false;
    }

    const items = textFieldsDropdownItems.map((item) => item.name);
    const invalidTextValues = textValues.filter((textValue) => {
      // If the text value is not empty and is not in the items list.
      return textValue && !items.includes(textValue);
    });
    if (invalidTextValues.length > 0) {
      alertDisplaying = true;

      const invalidTextValuesIndices = invalidTextValues.map((value) =>
        textValues.indexOf(value),
      );
      Alert.alert(
        "Notice",
        `You must select an item from the list.\n\n` +
          `The following items are not in the list: ` +
          `${invalidTextValues.join(", ")}`,
        [
          {
            text: "OK",
            onPress: () => {
              invalidTextValuesIndices.forEach((index) => {
                textFieldsRef[index].current &&
                  textFieldsRef[index].current.clear();
                updateName("", index);
              });
              textFieldsRef[invalidTextValuesIndices[0]].current.focus();
              alertDisplaying = false;
            },
            style: "cancel",
          },
        ],
      );
      return false;
    } else {
      return true;
    }
  };
  setDataValidationFunction(dataValidationFunction);

  return <View style={{ paddingTop: 10 }}>{textFields}</View>;
};

export default MultipleTextQuestionScreen;
