interface ICoinDataElement {
  imageUrl: string;
}

export default interface ICoinData {
  [key: string]: ICoinDataElement;
}
