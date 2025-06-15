// ::NODE

class DocNode {
  constructor(type, content = null, attrs = {}) {
    this.type = type;
    this.content = content;
    this.attrs = attrs;
    this.marks = [];
  }

  static text(text, marks = []) {
    const node = new DocNode("text", text);
    node.marks = marks;
    return node;
  }

  static paragraph(content = []) {
    return new DocNode("paragraph", content);
  }

  static heading(level, content = []) {
    return new DocNode("heading", content, { level });
  }

  static codeBlock(content = [], language = null) {
    const attrs = language ? { language } : {};
    return new DocNode("code_block", content, attrs);
  }

  static blockquote(content = []) {
    return new DocNode("blockquote", content);
  }

  static listItem(content = []) {
    return new DocNode("list_item", content);
  }

  static orderedList(content = []) {
    return new DocNode("ordered_list", content);
  }

  static bulletList(content = []) {
    return new DocNode("bullet_list", content);
  }

  static image(src, alt = "", title = "") {
    return new DocNode("image", null, { src, alt, title });
  }

  static horizontalRule() {
    return new DocNode("horizontal_rule");
  }

  isText() {
    return this.type === "text";
  }

  isBlock() {
    return ["paragraph", "heading", "code_block", "blockquote", "list_item", "ordered_list", "bullet_list", "horizontal_rule"].includes(this.type);
  }

  isInline() {
    return ["image"].includes(this.type);
  }

  textContent() {
    if (this.isText()) {
      return this.content || "";
    }

    if (Array.isArray(this.content)) {
      return this.content.map(child => child.textContent()).join("");
    }

    return "";
  }

  nodeSize() {
    if (this.isText()) {
      return (this.content || "").length;
    }

    if (Array.isArray(this.content)) {
      return this.content.reduce((size, child) => size + child.nodeSize(), 0);
    }

    return 0;
  }

  clone() {
    const cloned = new DocNode(this.type, null, { ...this.attrs });

    if (this.isText()) {
      cloned.content = this.content;
    } else if (Array.isArray(this.content)) {
      cloned.content = this.content.map(child => child.clone());
    }

    cloned.marks = [...this.marks];
    return cloned;
  }

  toJSON() {
    const json = {
      type: this.type
    };

    if (this.isText()) {
      json.text = this.content;
    } else if (Array.isArray(this.content)) {
      json.content = this.content.map(child => child.toJSON());
    }

    if (Object.keys(this.attrs).length > 0) {
      json.attrs = this.attrs;
    }

    if (this.marks.length > 0) {
      json.marks = this.marks.map(mark => mark.toJSON());
    }

    return json;
  }

  static fromJSON(json) {
    const node = new Node(json.type, null, json.attrs || {});

    if (json.text !== undefined) {
      node.content = json.text;
    } else if (json.content) {
      node.content = json.content.map(childJSON => Node.fromJSON(childJSON));
    }

    if (json.marks) {
      node.marks = json.marks.map(markJSON => Mark.fromJSON(markJSON));
    }

    return node;
  }
}

// :: DOC

class Doc {
  constructor(content = []) {
    this.content = content;
    this.type = "doc";
  }

  static empty() {
    return new Doc([DocNode.paragraph()]);
  }
}

// :: MARK
// represents inline formatting like bold, italic, etc. applied to text nodes to
// provide styling

class Mark {
  constructor(type, attrs = {}) {
    this.type = type;
    this.attrs = attrs;
  }

  static bold() {
    return new Mark("bold");
  }

  static italic() {
    return new Mark("italic");
  }

  // inline code 
  static code() {
    return new Mark("code");
  }

  static link(href, title = "") {
    return new Mark("link", { href, title });
  }

  static strikethrough() {
    return new Mark("strikethrough");
  }

  eq(other) {
    if (this.type !== other.type) {
      return false;
    }

    const thisAttrs = this.attrs || {};
    const otherAttrs = other.attrs || {};

    const thisKeys = Object.keys(thisAttrs);
    const otherKeys = Object.keys(otherAttrs);

    if (thisKeys.length !== otherKeys.length) {
      return false;
    }

    for (const key of thisKeys) {
      if (thisAttrs[key] !== otherAttrs[key]) {
        return false;
      }
    }

    return true;
  }

  clone() {
    return new Mark(this.type, { ...this.attrs });
  }

  toJSON() {
    const json = {
      type: this.type
    };

    if (Object.keys(this.attrs).length > 0) {
      json.attrs = this.attrs;
    }

    return json;
  }

  static fromJSON(json) {
    return new Mark(json.type, json.attrs || {});
  }

  getCSSClass() {
    switch (this.type) {
      case 'bold':
        return 'bold';
      case 'italic':
        return 'italic';
      case 'code':
        return 'inline-code';
      case 'link':
        return 'link';
      case 'strikethrough':
        return 'strikethrough';
      default:
        return '';
    }
  }

  getHTMLAttrs() {
    const attrs = {};

    switch (this.type) {
      case 'link':
        attrs.href = this.attrs.href || '#';
        if (this.attrs.title) {
          attrs.title = this.attrs.title;
        }
        break;
    }

    return attrs;
  }

  getHTMLTag() {
    switch (this.type) {
      case 'bold':
        return 'strong';
      case 'italic':
        return 'em';
      case 'code':
        return 'code';
      case 'link':
        return 'a';
      case 'strikethrough':
        return 'del';
      default:
        return 'span';
    }
  }
}

// MarkSet class represents a collection of marks
// Used to efficiently manage and compare sets of marks
class MarkSet {
  constructor(marks = []) {
    this.marks = marks;
  }

  add(mark) {
    for (const existing of this.marks) {
      if (existing.eq(mark)) {
        return this;
      }
    }

    return new MarkSet([...this.marks, mark]);
  }

  remove(mark) {
    const filtered = this.marks.filter(existing => !existing.eq(mark));
    return new MarkSet(filtered);
  }

  contains(mark) {
    return this.marks.some(existing => existing.eq(mark));
  }

  eq(other) {
    if (this.marks.length !== other.marks.length) {
      return false;
    }

    for (const mark of this.marks) {
      if (!other.contains(mark)) {
        return false;
      }
    }

    return true;
  }

  toArray() {
    return [...this.marks];
  }

  static empty() {
    return new MarkSet([]);
  }

  static from(marks) {
    return new MarkSet(marks);
  }
}


// :: PARSER
class MarkdownParser {
  constructor() {
    this.rules = {
      escape: /\\(.)/g,
      lineBreak: /\n/g,
      whitespace: /\s+/g
    }

    this.patterns = {
      heading: /^(#{1,6})\s+(.+)$/,
      codeBlockStart: /^```(\w+)?$/,
      codeBlockEnd: /^```$/,
      blockquote: /^>\s*/,
      orderedList: /^(\d+)\.\s+(.+)$/,
      bulletList: /^[-*+]\s+(.+)$/,
      horizontalRule: /^(-{3,}|\*{3,}|_{3,})$/,
    };


    this.blockRules = [
      {
        test: (line) => {
          const match = line.match(this.patterns.heading);
          if (match) {
            return {
              block: {
                type: 'heading',
                level: match[1].length,
                content: match[2]
              },
              consumed: 1
            };
          }
          return null;
        }
      },

      // CODE BLOCKS 
      {
        test: (line, lines, index) => {
          const match = line.match(this.patterns.codeBlockStart);
          if (match) {
            const language = match[1] || null;
            const content = [];
            let i = index + 1;

            while (i < lines.length && !lines[i].match(this.patterns.codeBlockEnd)) {
              content.push(lines[i]);
              i++;
            }

            return {
              block: {
                type: 'code_block',
                language: language,
                content: content.join('\n')
              },
              consumed: i - index + 1
            };
          }
          return null;
        }
      },

      // BLOCK QUOTES
      {
        test: (line, lines, index) => {
          if (line.match(this.patterns.blockquote)) {
            const content = [];
            let i = index;

            while (i < lines.length && lines[i].match(this.patterns.blockquote)) {
              content.push(lines[i].replace(this.patterns.blockquote, ''));
              i++;
            }

            return {
              block: {
                type: 'blockquote',
                content: content
              },
              consumed: i - index
            };
          }
          return null;
        }
      },

      // ORDERED LISTS
      {
        test: (line, lines, index) => {
          const match = line.match(this.patterns.orderedList);
          if (match) {
            const items = [];
            let i = index;

            while (i < lines.length) {
              const itemMatch = lines[i].match(this.patterns.orderedList);
              if (itemMatch) {
                items.push(itemMatch[2]);
                i++;
              } else if (lines[i].trim() === '') {
                i++;
                break;
              } else {
                break;
              }
            }

            return {
              block: {
                type: 'ordered_list',
                items: items
              },
              consumed: i - index
            };
          }
          return null;
        }
      },

      // UNORDERED LISTS
      {
        test: (line, lines, index) => {
          const match = line.match(this.patterns.bulletList);
          if (match) {
            const items = [];
            let i = index;

            while (i < lines.length) {
              const itemMatch = lines[i].match(this.patterns.bulletList);
              if (itemMatch) {
                items.push(itemMatch[1]);
                i++;
              } else if (lines[i].trim() === '') {
                i++;
                break;
              } else {
                break;
              }
            }

            return {
              block: {
                type: 'bullet_list',
                items: items
              },
              consumed: i - index
            };
          }
          return null;
        }
      },

      // HORIZONTAL RULE
      {
        test: (line) => {
          if (line.match(this.patterns.horizontalRule)) {
            return {
              block: {
                type: 'horizontal_rule'
              },
              consumed: 1
            };
          }
          return null;
        }
      }
    ];
  }

  parse(markdown) {
    if (typeof markdown !== "string") {
      return Doc.empty();
    }
    const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
    const blocks = this.parseBlocks(lines);
    const nodes = [];

    for (const block of blocks) {
      const node = this.blockToNode(block);
      if (node !== null) nodes.push(node);
    }

    return new Doc(nodes);
  }

  matchBlockRule(line, lines, index) {
    for (const rule of this.blockRules) {
      const match = rule.test(line, lines, index);
      if (match) {
        return match;
      }
    }
    return null;
  }

  parseInlineContent(text) {
    if (!text || typeof text !== 'string') {
      return [DocNode.text('')];
    }

    const tokens = this.tokenizeInline(text);
    return this.tokensToNodes(tokens);
  }

  tokensToNodes(tokens) {
    const nodes = [];

    for (const token of tokens) {
      switch (token.type) {
        case 'text':
          if (token.content) {
            nodes.push(DocNode.text(token.content));
          }
          break;

        case 'bold':
          const boldNode = DocNode.text(token.content);
          boldNode.marks.push(Mark.bold());
          nodes.push(boldNode);
          break;

        case 'italic':
          const italicNode = DocNode.text(token.content);
          italicNode.marks.push(Mark.italic());
          nodes.push(italicNode);
          break;

        case 'code':
          const codeNode = DocNode.text(token.content);
          codeNode.marks.push(Mark.code());
          nodes.push(codeNode);
          break;

        case 'link':
          const linkNode = DocNode.text(token.text);
          linkNode.marks.push(Mark.link(token.href, token.title));
          nodes.push(linkNode);
          break;

        case 'image':
          nodes.push(DocNode.image(token.src, token.alt, token.title));
          break;

        case 'strikethrough':
          const strikeNode = DocNode.text(token.content);
          strikeNode.marks.push(Mark.strikethrough());
          nodes.push(strikeNode);
          break;

        default:
          if (token.content) {
            nodes.push(DocNode.text(token.content));
          }
      }
    }

    return nodes.length > 0 ? nodes : [DocNode.text('')];
  }

  tokenizeInline(text) {
    const tokens = [];
    let pos = 0;
    const textLength = text.length;

    const combinedPattern = /(\*\*([^*]+)\*\*|\*([^*]+)\*|~~([^~]+)~~|\[([^\]]+)\]\(([^)]+)\)|!\[([^\]]*)\]\(([^)]+)\)|`([^`]+)`)/g;

    let match;
    let lastIndex = 0;

    while ((match = combinedPattern.exec(text)) !== null) {
      if (match.index > lastIndex) {
        tokens.push({
          type: 'text',
          content: text.slice(lastIndex, match.index)
        });
      }

      if (match[2]) { // bold **text**
        tokens.push({ type: 'bold', content: match[2] });
      } else if (match[3]) { // italic *text*
        tokens.push({ type: 'italic', content: match[3] });
      } else if (match[4]) { // strikethrough ~~text~~
        tokens.push({ type: 'strikethrough', content: match[4] });
      } else if (match[5] && match[6]) { // link [text](url)
        const parts = match[6].split(' ');
        tokens.push({
          type: 'link',
          text: match[5],
          href: parts[0],
          title: parts.slice(1).join(' ').replace(/^["']|["']$/g, '')
        });
      } else if (match[7] && match[8]) { // image ![alt](src)
        const parts = match[8].split(' ');
        tokens.push({
          type: 'image',
          alt: match[7],
          src: parts[0],
          title: parts.slice(1).join(' ').replace(/^["']|["']$/g, '')
        });
      } else if (match[9]) { // code `text`
        tokens.push({ type: 'code', content: match[9] });
      }

      lastIndex = match.index + match[0].length;
    }

    // add remaining text
    if (lastIndex < textLength) {
      tokens.push({
        type: 'text',
        content: text.slice(lastIndex)
      });
    }

    return tokens;
  }


  blockToNode(block) {
    switch (block.type) {
      case 'heading':
        return DocNode.heading(block.level, this.parseInlineContent(block.content));

      case 'code_block':
        return DocNode.codeBlock([DocNode.text(block.content)], block.language);

      case 'blockquote':
        const quoteContent = block.content.map(line =>
          DocNode.paragraph(this.parseInlineContent(line))
        );
        return DocNode.blockquote(quoteContent);

      case 'ordered_list':
        const orderedItems = block.items.map(item =>
          DocNode.listItem(this.parseInlineContent(item))
        );
        return DocNode.orderedList(orderedItems);

      case 'bullet_list':
        const bulletItems = block.items.map(item =>
          DocNode.listItem(this.parseInlineContent(item))
        );
        return DocNode.bulletList(bulletItems);

      case 'paragraph':
        const content = block.content.join(' ');
        return DocNode.paragraph(this.parseInlineContent(content));

      case 'horizontal_rule':
        return DocNode.horizontalRule();

      default:
        return null;
    }
  }

  parseBlocks(lines) {
    const blocks = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      if (!line.trim() && blocks.length === 0) {
        i++;
        continue;
      }

      const blockMatch = this.matchBlockRule(line, lines, i);
      if (blockMatch) {
        blocks.push(blockMatch.block);
        i += blockMatch.consumed;
      } else {
        const paragraphLines = [];
        while (i < lines.length && lines[i].trim() && !this.matchBlockRule(lines[i], lines, i)) {
          paragraphLines.push(lines[i]);
          i++;
        }

        if (paragraphLines.length > 0) {
          blocks.push({
            type: 'paragraph',
            content: paragraphLines
          });
        }

        if (i < lines.length && !lines[i].trim()) {
          i++;
        }
      }
    }

    return blocks;
  }

}

const MD = `
# Heading 1
\`\`\`javascript
console.log("Hello, World!");
\`\`\`
# Heading 2
## Subheading
\`\`\`python
print("Hello, Python!")
\`\`\`
`

console.time('myTimer');
const parser = new MarkdownParser();
const doc = parser.parse(MD);
console.timeEnd('myTimer');
console.log(doc);

console.log("hello")