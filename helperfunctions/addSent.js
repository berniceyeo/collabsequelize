const addSentProperty = (array, str) => {
  array.forEach((element) => {
    element.dataValues.sent = str;
  });
  return array;
};

export default addSentProperty;
