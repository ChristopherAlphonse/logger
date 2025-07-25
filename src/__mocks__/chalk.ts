const createChalkMock = () => {
  const colors = ['red', 'green', 'blue', 'yellow', 'magenta', 'cyan', 'gray', 'white', 'black'];
  const styles = ['bold', 'italic', 'underline', 'inverse', 'strikethrough'];

  type ChalkMock = ((text: string) => string) & Record<string, unknown>;
  const mock: ChalkMock = ((text: string) => text) as ChalkMock;

  for (const color of colors) {
    const colorFn = (text: string) => `[${color.toUpperCase()}]${text}[/${color.toUpperCase()}]`;
    mock[color] = colorFn;

    for (const style of styles) {
      (colorFn as typeof mock)[style] = (text: string) =>
        `[${color.toUpperCase()}-${style.toUpperCase()}]${text}[/${color.toUpperCase()}-${style.toUpperCase()}]`;
    }
  }

  for (const color of colors) {
    const bgColorName = `bg${color.charAt(0).toUpperCase()}${color.slice(1)}`;
    const bgColorFn = (text: string) =>
      `[BG-${color.toUpperCase()}]${text}[/BG-${color.toUpperCase()}]`;
    mock[bgColorName] = bgColorFn;

    for (const textColor of colors) {
      (bgColorFn as typeof mock)[textColor] = (text: string) =>
        `[BG-${color.toUpperCase()}-${textColor.toUpperCase()}]${text}[/BG-${color.toUpperCase()}-${textColor.toUpperCase()}]`;
    }
  }

  const bgBlackBrightFn = (text: string) => `[BG-GRAY]${text}[/BG-GRAY]`;
  mock.bgBlackBright = bgBlackBrightFn;
  mock.bgGray = bgBlackBrightFn;
  mock.bgGrey = bgBlackBrightFn;

  for (const textColor of colors) {
    (bgBlackBrightFn as typeof mock)[textColor] = (text: string) =>
      `[BG-GRAY-${textColor.toUpperCase()}]${text}[/BG-GRAY-${textColor.toUpperCase()}]`;
  }

  for (const color of colors) {
    const bgBrightName = `bg${color.charAt(0).toUpperCase()}${color.slice(1)}Bright`;
    const bgBrightFn = (text: string) =>
      `[BG-${color.toUpperCase()}-BRIGHT]${text}[/BG-${color.toUpperCase()}-BRIGHT]`;
    mock[bgBrightName] = bgBrightFn;

    for (const textColor of colors) {
      (bgBrightFn as typeof mock)[textColor] = (text: string) =>
        `[BG-${color.toUpperCase()}-BRIGHT-${textColor.toUpperCase()}]${text}[/BG-${color.toUpperCase()}-BRIGHT-${textColor.toUpperCase()}]`;
    }
  }

  for (const style of styles) {
    mock[style] = (text: string) => `[${style.toUpperCase()}]${text}[/${style.toUpperCase()}]`;
  }

  return mock;
};

export default createChalkMock();
