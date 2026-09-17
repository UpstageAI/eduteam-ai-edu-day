/* Scraps kept in notes.md: a word, a line about it, and any links. Newest last in the file, first on the wall. */
(() => {
  'use strict';

  // "## 말" starts a note. "key: value" lines directly under it are its frontmatter;
  // after that, plain lines describe it and bare URLs become its links.
  const FRONTMATTER = /^([a-z][a-z0-9_-]*):\s*(.*)$/;
  const KINDS = new Set(['repo', 'link', 'term']);

  function parse(text) {
    const notes = [];
    for (const line of String(text).split('\n')) {
      const row = line.trim();
      if (row.startsWith('## ')) {
        notes.unshift({ term: row.slice(3).trim(), kind: 'term', memo: '', links: [] });
        continue;
      }
      const note = notes[0];
      if (!note || !row || row.startsWith('#')) continue;
      const field = !note.memo && !note.links.length && FRONTMATTER.exec(row);
      if (field) {
        // An unknown kind reads as a plain term rather than silently taking a link's colour.
        if (field[1] === 'kind' && KINDS.has(field[2].trim())) note.kind = field[2].trim();
        continue;
      }
      if (/^https?:\/\//i.test(row)) note.links.push(row);
      else note.memo = note.memo ? `${note.memo} ${row}` : row;
    }
    return notes.filter(note => note.term);
  }

  // A note is small, so a link shows where it goes and the last thing in the path.
  function shorten(href) {
    try {
      const url = new URL(href);
      const host = url.hostname.replace(/^www\./, '');
      const last = url.pathname.split('/').filter(Boolean).pop();
      return last ? `${host}/${last}` : host;
    } catch {
      return href;
    }
  }

  function createNote(note) {
    const sticker = document.createElement('article');
    sticker.className = 'note';
    sticker.dataset.kind = note.kind || 'term';

    const term = document.createElement('h3');
    term.className = 'note-term';
    term.textContent = note.term;
    sticker.append(term);

    if (note.memo) {
      const memo = document.createElement('p');
      memo.className = 'note-memo';
      memo.textContent = note.memo;
      sticker.append(memo);
    }

    if (note.links.length) {
      const list = document.createElement('ul');
      list.className = 'note-links';
      for (const href of note.links) {
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.setAttribute('href', href);
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
        link.setAttribute('aria-label', `${note.term} · ${shorten(href)} 새 탭에서 열기`);
        link.textContent = `${shorten(href)} ↗`;
        item.append(link);
        list.append(item);
      }
      sticker.append(list);
    }
    return sticker;
  }

  async function render() {
    const wall = document.querySelector('#note-wall');
    const section = document.querySelector('#notes');
    if (!wall || !section) return [];
    try {
      const response = await fetch('./notes.md', { cache: 'no-cache' });
      if (!response.ok) throw new Error('notes.md is unavailable');
      const notes = parse(await response.text());
      notes.forEach(note => wall.append(createNote(note)));
      if (notes.length) section.hidden = false; // The wall only appears when something is pinned to it.
      return notes;
    } catch {
      return []; // The materials above stay readable when the file is missing.
    }
  }

  window.EduDayNotes = Object.freeze({ createNote, parse, render, shorten });
  render();
})();
