// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { applyGlobalThemeColors } from '../src/lib/theme-colors';
import { MarkdownPreview } from '../src/components/MarkdownPreview';

describe('Notion-style scrollbar settings', () => {
  it('applies light Notion scrollbar variables to document root for light themes', () => {
    applyGlobalThemeColors('vs', true);
    const root = document.documentElement;
    expect(root.style.getPropertyValue('--scrollbar-thumb')).toBe('rgba(55, 53, 47, 0.2)');
    expect(root.style.getPropertyValue('--scrollbar-thumb-hover')).toBe('rgba(55, 53, 47, 0.38)');
    expect(root.style.getPropertyValue('--scrollbar-thumb-active')).toBe('rgba(55, 53, 47, 0.55)');
  });

  it('applies dark Notion scrollbar variables to document root for dark themes', () => {
    applyGlobalThemeColors('vs-dark', false);
    const root = document.documentElement;
    expect(root.style.getPropertyValue('--scrollbar-thumb')).toBe('rgba(255, 255, 255, 0.18)');
    expect(root.style.getPropertyValue('--scrollbar-thumb-hover')).toBe('rgba(255, 255, 255, 0.35)');
    expect(root.style.getPropertyValue('--scrollbar-thumb-active')).toBe('rgba(255, 255, 255, 0.55)');
  });

  it('renders MarkdownPreview with theme-matched Notion scrollbar variables', () => {
    const { container: lightContainer } = render(
      <MarkdownPreview content="# Test" theme="vs" />
    );
    const lightDiv = lightContainer.firstElementChild as HTMLElement;
    expect(lightDiv.style.getPropertyValue('--scrollbar-thumb')).toBe('rgba(55, 53, 47, 0.2)');

    const { container: darkContainer } = render(
      <MarkdownPreview content="# Test" theme="vs-dark" />
    );
    const darkDiv = darkContainer.firstElementChild as HTMLElement;
    expect(darkDiv.style.getPropertyValue('--scrollbar-thumb')).toBe('rgba(255, 255, 255, 0.18)');
  });
});
