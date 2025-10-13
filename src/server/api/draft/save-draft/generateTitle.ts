import ollama from '../../../services/ollama';

export async function generateTitle(content: string, chatModel: string | null) {
  const fallback = fallbackTitle(content);

  if (!chatModel) {
    return fallback;
  }

  try {
    const titleResponse = await ollama.chat({
      model: chatModel,
      messages: [
        {
          role: 'system',
          content:
            'Generate a concise, descriptive title of 2-4 words for the provided note. Reply with the title only.',
        },
        {
          role: 'user',
          content,
        },
      ],
    });

    const generated = titleResponse?.message?.content?.trim();
    const normalized = normalizeTitle(generated);

    if (normalized) {
      return normalized;
    }
  } catch (error) {
    console.warn('Failed to generate note title:', error);
  }

  return fallback;
}

function fallbackTitle(content: string) {
  const headingMatch = content.match(/^#{1,6}\s+(.+)$/m);
  if (headingMatch) {
    const normalizedHeading = normalizeTitle(headingMatch[1]);
    if (normalizedHeading) {
      return normalizedHeading;
    }
  }

  const firstNonEmptyLine = content
    .split('\n')
    .map(line => line.trim())
    .find(Boolean);

  if (firstNonEmptyLine) {
    const normalizedLine = normalizeTitle(firstNonEmptyLine);
    if (normalizedLine) {
      return normalizedLine;
    }
  }

  return 'Personal Note';
}

function normalizeTitle(rawTitle: string | undefined | null) {
  if (!rawTitle) return '';

  const sanitized = rawTitle
    .replace(/[^\w\s'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!sanitized) return '';

  const words = sanitized.split(' ').filter(Boolean);
  if (!words.length) return '';

  const truncated = words.slice(0, 4);

  while (truncated.length < 2 && words.length > truncated.length) {
    truncated.push(words[truncated.length]);
  }

  while (truncated.length < 2) {
    truncated.push('Note');
  }

  return truncated.join(' ');
}
