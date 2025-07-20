// Mock chalk for testing
const createChalkMock = () => {
  const colors = ['red', 'green', 'blue', 'yellow', 'magenta', 'cyan', 'gray', 'white', 'black'];
  const styles = ['bold', 'italic', 'underline', 'inverse', 'strikethrough'];

  type ChalkMock = ((text: string) => string) & Record<string, unknown>;
  const mock: ChalkMock = ((text: string) => text) as ChalkMock;

  // Add color methods with chaining support

  for (const color of colors) {
    const colorFn = (text: string) => `[${color.toUpperCase()}]${text}[/${color.toUpperCase()}]`;
    // Assign color function to mock with proper typing
    mock[color] = colorFn;

    // Add style chaining to each color
    for (const style of styles) {
      // Add style chaining to each color function
      (colorFn as typeof mock)[style] = (text: string) =>
        `[${color.toUpperCase()}-${style.toUpperCase()}]${text}[/${color.toUpperCase()}-${style.toUpperCase()}]`;
    }
  }

  // Add style methods

  for (const style of styles) {
    mock[style] = (text: string) => `[${style.toUpperCase()}]${text}[/${style.toUpperCase()}]`;
  }

  return mock;
};

export default createChalkMock();
