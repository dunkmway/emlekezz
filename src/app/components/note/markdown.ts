export function markdownCommands(event: KeyboardEvent) {
  const key = event.key;
  const target = event.target as HTMLInputElement;
  const value = target.value;
  const selectionStart = target.selectionStart!;
  const selectionEnd = target.selectionEnd!;
  const lineStart = getLineStartIndex(value, selectionEnd);
  const lineEnd = getLineEndIndex(value, selectionEnd);

  if (key === 'Tab') {
    event.preventDefault();
    const listLine = getListLine(value, lineStart, lineEnd);
    // list start
    if (listLine) {
      target.value =
        value.substring(0, lineStart) + '\t' + value.substring(lineStart);
      target.selectionStart = target.selectionEnd = selectionStart + 1;
    } else {
      target.value =
        value.substring(0, selectionStart) +
        '\t' +
        value.substring(selectionEnd);
      target.selectionStart = target.selectionEnd = selectionStart + 1;
    }
  } else if (key === 'Enter') {
    const listLine = getListLine(value, lineStart, lineEnd);
    if (listLine) {
      event.preventDefault();
      const [tabbing, prefix, content] = listLine;

      // no content
      if (content === '' || event.shiftKey) {
        // no tabs. clear the hyphen
        if (tabbing === '') {
          target.value =
            value.substring(0, lineStart) + content + value.substring(lineEnd);
          target.selectionStart = target.selectionEnd =
            selectionEnd - prefix.length;
        }
        // tabs. remove a tab
        else {
          target.value =
            value.substring(0, lineStart) +
            `${tabbing.substring(1)}${prefix}${content}` +
            value.substring(lineEnd);
          target.selectionStart = target.selectionEnd = lineEnd - 1;
        }
      }
      // content
      else {
        target.value =
          value.substring(0, selectionEnd) +
          `\n${tabbing}${prefix}` +
          value.substring(selectionEnd, lineEnd) +
          value.substring(lineEnd);
        target.selectionStart = target.selectionEnd =
          selectionEnd + 1 + tabbing.length + prefix.length;
      }
    }
  } else if (key === 'b' && event.ctrlKey) {
    event.preventDefault();
    target.value =
      value.substring(0, selectionStart) +
      '**' +
      value.substring(selectionStart, selectionEnd) +
      '**' +
      value.substring(selectionEnd);
    target.selectionStart = target.selectionEnd = selectionStart + 2;
  } else if (key === 'l' && event.ctrlKey) {
    event.preventDefault();
    target.value =
      value.substring(0, selectionStart) +
      '[' +
      value.substring(selectionStart, selectionEnd) +
      ']()' +
      value.substring(selectionEnd);
    target.selectionStart = target.selectionEnd =
      selectionStart === selectionEnd ? selectionStart + 1 : selectionEnd + 3;
  } else if (key === 'i' && event.ctrlKey) {
    event.preventDefault();
    target.value =
      value.substring(0, selectionStart) +
      '*' +
      value.substring(selectionStart, selectionEnd) +
      '*' +
      value.substring(selectionEnd);
    target.selectionStart = target.selectionEnd = selectionStart + 2;
  }

  return target.value;
}

function getListLine(value: string, lineStart: number, lineEnd: number) {
  const line = value.substring(lineStart, lineEnd);
  const regex = /(\t*)(- +)(.*)/g;
  const match = [...line.matchAll(regex)];
  if (match.length === 1) {
    const [full, ...rest] = match[0];
    return rest;
  } else {
    return null;
  }
}

function getLineStartIndex(value: string, selection: number) {
  let lineStart = value.lastIndexOf('\n', selection - 1) + 1;

  // If the selection is on the first line and no preceding newline is found
  if (lineStart === 0 && selection > 0 && value[0] !== '\n') {
    lineStart = 0;
  }

  return lineStart;
}

function getLineEndIndex(value: string, selection: number) {
  let lineEnd = value.indexOf('\n', selection);

  // If the selection is on the last line and no following newline is found
  if (lineEnd === -1) {
    lineEnd = value.length;
  }

  return lineEnd;
}
