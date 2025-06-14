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
    const cloned = new Node(this.type, null, { ...this.attrs });

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

// :: PARSER
class MarkdownParser {
  constructor() {
    this.rules = {
      escape: /\\(.)/g,
      lineBreak: /\n/g,
      whitespace: /\s+/g
    }


    this.blockRules = [
      // HEADINGS 1-6
      {
        test: (line) => {
          const match = line.match(/^(#{1,6})\s+(.+)$/);
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
    ]

    this.inlineRules = [
      // BOLD
      {
        test: (text, pos) => {
          const match = text.slice(pos).match(/^\*\*([^*]+)\*\*/);
          if (match) {
            return {
              start: pos,
              end: pos + match[0].length,
              token: {
                type: "bold",
                content: match[1]
              }
            }
          }
          return null;
        },
        findNext: (text, pos) => {
          const index = text.indexOf("**", pos);
          return index
        }
      }
    ]
  }

  parse(markdown) {
    if (typeof markdown !== "string") {
      return Doc.empty(); // TODO: actually make a Doc object
    }

    const normalizedText = markdown.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const blocks = this.parseBlocks(normalizedText);
    const nodes = blocks.map(block => this.blockToNode(block));
    return new Doc(nodes.filter(node => node !== null));
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

    while (pos < text.length) {
      let matched = false;

      for (const rule of this.inlineRules) {
        const match = rule.test(text, pos);
        if (match) {
          if (match.start > pos) {
            tokens.push({
              type: 'text',
              content: text.slice(pos, match.start)
            });
          }

          tokens.push(match.token);
          pos = match.end;
          matched = true;
          break;
        }
      }

      if (!matched) {
        // no rule matched, advance by one character
        const nextRulePos = this.findNextRulePosition(text, pos + 1);
        tokens.push({
          type: 'text',
          content: text.slice(pos, nextRulePos)
        });
        pos = nextRulePos;
      }
    }

    return tokens;
  }

  findNextRulePosition(text, startPos) {
    let minPos = text.length;

    for (const rule of this.inlineRules) {
      const pos = rule.findNext(text, startPos);
      if (pos !== -1 && pos < minPos) {
        minPos = pos;
      }
    }

    return minPos;
  }

  blockToNode(block) {
    switch (block.type) {
      case 'heading':
        return DocNode.heading(block.level, this.parseInlineContent(block.content));
      default:
        return null;
    }
  }

  parseBlocks(text) {
    const lines = text.split('\n');
    const blocks = [];
    let currentBlock = [];
    let i = 0

    while (i < lines.length) {
      const line = lines[i];
      const trimmedLine = line.trim();
      if (!trimmedLine && !currentBlock) {
        i++;
        continue;
      }

      const blockMatch = this.matchBlockRule(line, lines, i);
      if (blockMatch) {
        if (currentBlock) {
          blocks.push(currentBlock);
          currentBlock = null;
        }

        blocks.push(blockMatch.block);
        i += blockMatch.consumed;
      } else if (!trimmedLine) {
        // empty lines, end of current block
        if (currentBlock) {
          blocks.push(currentBlock);
          currentBlock = null;
        }
      } else {
        // regular line. add to current paragraph
        if (!currentBlock) {
          currentBlock = {
            type: 'paragraph',
            content: []
          }
        }

        if (currentBlock.type === 'paragraph') {
          currentBlock.content.push(line);
        } else {
          blocks.push(currentBlock);
          currentBlock = {
            type: 'paragraph',
            content: [line]
          };
        }

        i++
      }
    }

    if (currentBlock) {
      blocks.push(currentBlock);
    }

    return blocks;
  }

}

const MD = `
# h1

## h2

**ASDFDS**
`

const parser = new MarkdownParser();
const doc = parser.parse(MD);
console.log(doc);

console.log("hello")