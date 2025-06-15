// ::NODE

/**
 * Represents a node in the document tree.
 */
class DocNode {
  /**
   * Creates a new document node.
   * @param {string} type - The type of the node (e.g., "text", "paragraph", "heading").
   * @param {string|Array<DocNode>} [content=null] - The content of the node, either text or an array of child nodes.
   * @param {Object} [attrs={}] - Additional attributes for the node.
   */
  constructor(type, content = null, attrs = {}) {
    this.type = type;
    this.content = content;
    this.attrs = attrs;
    this.marks = [];
  }

  /**
   * Creates a text node.
   * @param {string} text - The text content.
   * @param {Array<Mark>} [marks=[]] - An array of marks to apply to the text.
   * @returns {DocNode} A new text node.
   */
  static text(text, marks = []) {
    const node = new DocNode("text", text);
    node.marks = marks;
    return node;
  }

  /**
   * Creates a paragraph node.
   * @param {Array<DocNode>} [content=[]] - The content of the paragraph.
   * @returns {DocNode} A new paragraph node.
   */
  static paragraph(content = []) {
    return new DocNode("paragraph", content);
  }

  /**
   * Creates a heading node.
   * @param {number} level - The heading level (1-6).
   * @param {Array<DocNode>} [content=[]] - The content of the heading.
   * @returns {DocNode} A new heading node.
   */
  static heading(level, content = []) {
    return new DocNode("heading", content, { level });
  }

  /**
   * Creates a code block node.
   * @param {Array<DocNode>} [content=[]] - The content of the code block.
   * @param {string} [language=null] - The programming language of the code.
   * @returns {DocNode} A new code block node.
   */
  static codeBlock(content = [], language = null) {
    const attrs = language ? { language } : {};
    return new DocNode("code_block", content, attrs);
  }

  /**
   * Creates a blockquote node.
   * @param {Array<DocNode>} [content=[]] - The content of the blockquote.
   * @returns {DocNode} A new blockquote node.
   */
  static blockquote(content = []) {
    return new DocNode("blockquote", content);
  }

  /**
   * Creates a list item node.
   * @param {Array<DocNode>} [content=[]] - The content of the list item.
   * @returns {DocNode} A new list item node.
   */
  static listItem(content = []) {
    return new DocNode("list_item", content);
  }

  /**
   * Creates an ordered list node.
   * @param {Array<DocNode>} [content=[]] - The list items.
   * @returns {DocNode} A new ordered list node.
   */
  static orderedList(content = []) {
    return new DocNode("ordered_list", content);
  }

  /**
   * Creates a bullet list node.
   * @param {Array<DocNode>} [content=[]] - The list items.
   * @returns {DocNode} A new bullet list node.
   */
  static bulletList(content = []) {
    return new DocNode("bullet_list", content);
  }

  /**
   * Creates an image node.
   * @param {string} src - The source URL of the image.
   * @param {string} [alt=""] - The alt text for the image.
   * @param {string} [title=""] - The title of the image.
   * @returns {DocNode} A new image node.
   */
  static image(src, alt = "", title = "") {
    return new DocNode("image", null, { src, alt, title });
  }

  /**
   * Creates a horizontal rule node.
   * @returns {DocNode} A new horizontal rule node.
   */
  static horizontalRule() {
    return new DocNode("horizontal_rule");
  }

  /**
   * Checks if the node is a text node.
   * @returns {boolean} True if the node is a text node, false otherwise.
   */
  isText() {
    return this.type === "text";
  }

  /**
   * Checks if the node is a block-level node.
   * @returns {boolean} True if the node is a block node, false otherwise.
   */
  isBlock() {
    return ["paragraph", "heading", "code_block", "blockquote", "list_item", "ordered_list", "bullet_list", "horizontal_rule"].includes(this.type);
  }

  /**
   * Checks if the node is an inline node.
   * @returns {boolean} True if the node is an inline node, false otherwise.
   */
  isInline() {
    return ["image"].includes(this.type);
  }

  /**
   * Retrieves the text content of the node and its children.
   * @returns {string} The text content.
   */
  textContent() {
    if (this.isText()) {
      return this.content || "";
    }

    if (Array.isArray(this.content)) {
      return this.content.map(child => child.textContent()).join("");
    }

    return "";
  }

  /**
   * Calculates the size of the node in characters.
   * @returns {number} The size of the node.
   */
  nodeSize() {
    if (this.isText()) {
      return (this.content || "").length;
    }

    if (Array.isArray(this.content)) {
      return this.content.reduce((size, child) => size + child.nodeSize(), 0);
    }

    return 0;
  }

  /**
   * Creates a deep copy of the node.
   * @returns {DocNode} A cloned node.
   */
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

  /**
   * Serializes the node to a JSON object.
   * @returns {Object} The JSON representation of the node.
   */
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

  /**
   * Creates a node from a JSON object.
   * @param {Object} json - The JSON object representing the node.
   * @returns {DocNode} A new node instance.
   */
  static fromJSON(json) {
    const node = new DocNode(json.type, null, json.attrs || {});

    if (json.text !== undefined) {
      node.content = json.text;
    } else if (json.content) {
      node.content = json.content.map(childJSON => DocNode.fromJSON(childJSON));
    }

    if (json.marks) {
      node.marks = json.marks.map(markJSON => Mark.fromJSON(markJSON));
    }

    return node;
  }
}

// :: DOC

/**
 * Represents the entire document.
 */
class Doc {
  /**
   * Creates a new document.
   * @param {Array<DocNode>} [content=[]] - The content of the document.
   */
  constructor(content = []) {
    this.content = content;
    this.type = "doc";
  }

  /**
   * Creates an empty document with a single empty paragraph.
   * @returns {Doc} A new empty document.
   */
  static empty() {
    return new Doc([DocNode.paragraph()]);
  }

  /**
   * Parses Markdown text into a document.
   * @param {string} markdown - The Markdown text to parse.
   * @returns {Doc} A new document instance.
   */
  static fromMarkdown(markdown) {
    return new MarkdownParser().parse(markdown);
  }

  /**
   * Calculates the total size of the document in characters.
   * @returns {number} The size of the document.
   */
  nodeSize() {
    return this.content.reduce((size, node) => size + node.nodeSize(), 0);
  }

  /**
   * Retrieves the entire text content of the document.
   * @returns {string} The text content.
   */
  textContent() {
    return this.content.map(node => node.textContent()).join("\n");
  }

  /**
   * Finds the node at the specified position.
   * @param {number} pos - The position in the document.
   * @returns {Object|null} An object containing the node, offset, path, and parent, or null if not found.
   */
  nodeAt(pos) {
    let currentPos = 0;

    for (let i = 0; i < this.content.length; i++) {
      const node = this.content[i];
      const nodeSize = node.nodeSize();

      if (currentPos + nodeSize > pos) {
        if (node.isText()) {
          return {
            node,
            offset: pos - currentPos,
            path: [i],
            parent: this
          };
        } else if (Array.isArray(node.content)) {
          const result = this.findInNode(node, pos - currentPos, [i]);
          if (result) {
            result.parent = this;
            return result;
          }
        }
      }

      currentPos += nodeSize;
    }

    return null;
  }

  /**
   * Finds a node at a specific position within another node.
   * @param {DocNode} node - The node to search within.
   * @param {number} pos - The position within the node.
   * @param {Array<number>} path - The path to the node.
   * @returns {Object|null} An object containing the node, offset, parent, and path, or null if not found.
   */
  findInNode(node, pos, path = []) {
    let currentPos = 0;

    for (let i = 0; i < node.content.length; i++) {
      const child = node.content[i];
      const childSize = child.nodeSize();

      if (currentPos + childSize > pos) {
        if (child.isText()) {
          return {
            node: child,
            offset: pos - currentPos,
            parent: node,
            path: [...path, i]
          }
        } else if (Array.isArray(child.content)) {
          return this.findInNode(child, pos - currentPos, [...path, i]);
        }
      }
      currentPos += childSize;
    }

    return {
      node: node,
      offset: pos,
      path: path
    }
  }

  /**
   * Creates a deep copy of the document.
   * @returns {Doc} A cloned document.
   */
  clone() {
    return new Doc(this.content.map(node => node.clone()));
  }

  /**
   * Inserts content at the specified position.
   * @param {number} pos - The position to insert at.
   * @param {string|DocNode} content - The content to insert (text or node).
   * @returns {Doc} A new document with the inserted content.
   */
  insert(pos, content) {
    const result = this.nodeAt(pos);
    if (!result) {
      // at the end 
      const newContent = [...this.content];
      if (typeof content === "string") {
        newContent.push(DocNode.paragraph([DocNode.text(content)]));
      } else {
        newContent.push(content);
      }

      return new Doc(newContent);
    }

    const newDoc = this.clone();
    const { node, offset, path } = result;

    if (node.isText()) {
      const newText = node.content.slice(0, offset) + content + node.content.slice(offset);
      node.content = newText;
    } else {
      if (typeof content === 'string') {
        parent.content.splice(path[path.length - 1], 0, DocNode.text(content));
      } else {
        parent.content.splice(path[path.length - 1], 0, content);
      }
    }

    return newDoc;
  }

  /**
   * Deletes content between the specified positions.
   * @param {number} from - The starting position.
   * @param {number} to - The ending position.
   * @returns {Doc} A new document with the content deleted.
   */
  delete(from, to) {
    if (from >= to) return this.clone();

    const newDoc = this.clone();
    const fromResult = newDoc.nodeAt(from);
    const toResult = newDoc.nodeAt(to);

    if (!fromResult || !toResult) return newDoc;

    if (fromResult.node === toResult.node && fromResult.node.isText()) {
      const node = fromResult.node;
      node.content = node.content.slice(0, fromResult.offset) +
        node.content.slice(toResult.offset);
      return newDoc;
    }

    // TODO: HANDLE DELETION ACROSS MULTIPLE NODES
    return newDoc;
  }

  /**
   * Replaces content between positions with new content.
   * @param {number} from - The starting position.
   * @param {number} to - The ending position.
   * @param {string|DocNode} content - The content to insert.
   * @returns {Doc} A new document with the content replaced.
   */
  replace(from, to, content) {
    return this.delete(from, to).insert(from, content);
  }

  /**
   * Splits a text node at the specified position.
   * @param {number} pos - The position to split at.
   * @returns {Doc} A new document with the node split.
   */
  split(pos) {
    const result = this.nodeAt(pos);
    if (!result || !result.node.isText()) return this.clone();

    const newDoc = this.clone();
    const { node, offset, parent, path } = result;

    if (offset === 0 || offset === node.content.length) {
      return newDoc;
    }

    const leftText = node.content.slice(0, offset);
    const rightText = node.content.slice(offset);

    node.content = leftText;
    const rightNode = DocNode.text(rightText);

    parent.content.splice(path[path.length - 1] + 1, 0, rightNode);

    return newDoc;
  }

  /**
   * Joins two adjacent text nodes at the specified position.
   * @param {number} pos - The position to join at.
   * @returns {Doc} A new document with the nodes joined.
   */
  join(pos) {
    const result = this.nodeAt(pos);
    if (!result) return this.clone();

    const newDoc = this.clone();
    const { parent, path } = result;
    const nodeIndex = path[path.length - 1];

    if (nodeIndex === 0 || nodeIndex >= parent.content.length - 1) {
      return newDoc; // Cannot join
    }

    const leftNode = parent.content[nodeIndex - 1];
    const rightNode = parent.content[nodeIndex];

    if (leftNode.isText() && rightNode.isText()) {
      // Join text nodes
      leftNode.content += rightNode.content;
      parent.content.splice(nodeIndex, 1);
    }

    return newDoc;
  }

  /**
   * Serializes the document to a JSON object.
   * @returns {Object} The JSON representation of the document.
   */
  toJSON() {
    return {
      type: 'doc',
      content: this.content.map(node => node.toJSON())
    };
  }

  /**
   * Creates a document from a JSON object.
   * @param {Object} json - The JSON object representing the document.
   * @returns {Doc} A new document instance.
   */
  static fromJSON(json) {
    const content = json.content ? json.content.map(nodeJSON => DocNode.fromJSON(nodeJSON)) : [];
    return new Doc(content);
  }

  /**
   * Finds all nodes of a specific type.
   * @param {string} type - The type of nodes to find.
   * @returns {Array<{node: DocNode, path: Array<number>}>} An array of objects containing the nodes and their paths.
   */
  findNodesByType(type) {
    const nodes = [];

    const traverse = (node, path = []) => {
      if (node.type === type) {
        nodes.push({ node, path });
      }

      if (Array.isArray(node.content)) {
        node.content.forEach((child, index) => {
          traverse(child, [...path, index]);
        });
      }
    };

    this.content.forEach((node, index) => {
      traverse(node, [index]);
    });
    return nodes;
  }

  /**
   * Gets the first child node.
   * @returns {DocNode|null} The first child node or null if none.
   */
  firstChild() {
    return this.content[0] || null;
  }

  /**
   * Gets the last child node.
   * @returns {DocNode|null} The last child node or null if none.
   */
  lastChild() {
    return this.content[this.content.length - 1] || null;
  }

  /**
   * Checks if the document is empty.
   * @returns {boolean} True if the document is empty, false otherwise.
   */
  isEmpty() {
    if (this.content.length === 0) {
      return true;
    }

    if (this.content.length === 1) {
      const firstNode = this.content[0];
      if (firstNode.type === 'paragraph' && Array.isArray(firstNode.content)) {
        if (firstNode.content.length === 0) {
          return true;
        }
        if (firstNode.content.length === 1 && firstNode.content[0].isText() && !firstNode.content[0].content) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Validates the document structure.
   * @returns {Array<string>} An array of error messages, or an empty array if valid.
   */
  validate() {
    // Check that all nodes are valid
    const errors = [];

    const validateNode = (node, path = []) => {
      if (!node.type) {
        errors.push(`Node at ${path.join('.')} has no type`);
      }

      if (Array.isArray(node.content)) {
        node.content.forEach((child, index) => {
          validateNode(child, [...path, index]);
        });
      }
    };

    this.content.forEach((node, index) => {
      validateNode(node, [index]);
    });

    return errors;
  }

  /**
   * Calculates the position from a node path.
   * @param {Array<number>} path - The path to the node.
   * @returns {number} The position in the document.
   */
  getPositionByPath(path) {
    let pos = 0;
    let current = this;

    for (let i = 0; i < path.length; i++) {
      const index = path[i];

      for (let j = 0; j < index; j++) {
        pos += current.content[j].nodeSize();
      }

      if (i < path.length - 1) {
        current = current.content[index];
      }
    }

    return pos;
  }

  /**
   * Gets the path to the node at the specified position.
   * @param {number} pos - The position in the document.
   * @returns {Array<number>} The path to the node.
   */
  getPathByPosition(pos) {
    const result = this.nodeAt(pos);
    return result ? result.path : [];
  }

  /**
   * Iterates over all text nodes in the document.
   * @param {Function} callback - The callback function to call for each text node.
   */
  forEachTextNode(callback) {
    const traverse = (node, path = []) => {
      if (node.isText()) {
        callback(node, path);
      } else if (Array.isArray(node.content)) {
        node.content.forEach((child, index) => {
          traverse(child, [...path, index]);
        });
      }
    };

    this.content.forEach((node, index) => {
      traverse(node, [index]);
    });
  }

  /**
   * Converts a position to line and column numbers.
   * @param {number} pos - The position in the document.
   * @returns {Object} An object with line and column properties.
   */
  getLineColumn(pos) {
    const text = this.textContent();
    const beforePos = text.slice(0, pos);
    const lines = beforePos.split('\n');

    return {
      line: lines.length,
      column: lines[lines.length - 1].length + 1
    };
  }

  /**
   * Converts line and column to a position.
   * @param {number} line - The line number.
   * @param {number} column - The column number.
   * @returns {number} The position in the document.
   */
  getPositionFromLineColumn(line, column) {
    const text = this.textContent();
    const lines = text.split('\n');

    if (line > lines.length) {
      return text.length;
    }

    let pos = 0;
    for (let i = 0; i < line - 1; i++) {
      pos += lines[i].length + 1; // +1 for newline
    }

    pos += Math.min(column - 1, lines[line - 1].length);
    return pos;
  }

  /**
   * Retrieves the node at the specified path.
   * @param {Array<number>} path - The path to the node.
   * @returns {DocNode|null} The node at the path or null if not found.
   */
  getNodeAtPath(path) {
    let currentNode = { content: this.content };
    for (let i = 0; i < path.length; i++) {
      const index = path[i];
      if (!currentNode.content || index >= currentNode.content.length) {
        return null;
      }
      currentNode = currentNode.content[index];
    }
    return currentNode;
  }

  /**
   * Finds the position of a specific node.
   * @param {DocNode} targetNode - The node to find.
   * @returns {number} The position of the node or -1 if not found.
   */
  getPositionOfNode(targetNode) {
    let position = 0;
    const traverse = (nodes) => {
      for (const node of nodes) {
        if (node === targetNode) {
          return position;
        }
        if (node.isText()) {
          position += node.content.length;
        } else if (Array.isArray(node.content)) {
          const foundPos = traverse(node.content);
          if (foundPos !== -1) {
            return foundPos;
          }
        }
      }
      return -1; // Not found in this branch
    };
    return traverse(this.content);
  }
}

// :: MARK

/**
 * Represents an inline formatting mark.
 */
class Mark {
  /**
   * Creates a new mark.
   * @param {string} type - The type of the mark (e.g., "bold", "italic").
   * @param {Object} [attrs={}] - Additional attributes for the mark.
   */
  constructor(type, attrs = {}) {
    this.type = type;
    this.attrs = attrs;
  }

  /**
   * Creates a bold mark.
   * @returns {Mark} A new bold mark.
   */
  static bold() {
    return new Mark("bold");
  }

  /**
   * Creates an italic mark.
   * @returns {Mark} A new italic mark.
   */
  static italic() {
    return new Mark("italic");
  }

  /**
   * Creates an inline code mark.
   * @returns {Mark} A new code mark.
   */
  static code() {
    return new Mark("code");
  }

  /**
   * Creates a link mark.
   * @param {string} href - The URL of the link.
   * @param {string} [title=""] - The title of the link.
   * @returns {Mark} A new link mark.
   */
  static link(href, title = "") {
    return new Mark("link", { href, title });
  }

  /**
   * Creates a strikethrough mark.
   * @returns {Mark} A new strikethrough mark.
   */
  static strikethrough() {
    return new Mark("strikethrough");
  }

  /**
   * Checks if this mark is equal to another mark.
   * @param {Mark} other - The other mark to compare.
   * @returns {boolean} True if the marks are equal, false otherwise.
   */
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

  /**
   * Creates a copy of the mark.
   * @returns {Mark} A cloned mark.
   */
  clone() {
    return new Mark(this.type, { ...this.attrs });
  }

  /**
   * Serializes the mark to a JSON object.
   * @returns {Object} The JSON representation of the mark.
   */
  toJSON() {
    const json = {
      type: this.type
    };

    if (Object.keys(this.attrs).length > 0) {
      json.attrs = this.attrs;
    }

    return json;
  }

  /**
   * Creates a mark from a JSON object.
   * @param {Object} json - The JSON object representing the mark.
   * @returns {Mark} A new mark instance.
   */
  static fromJSON(json) {
    return new Mark(json.type, json.attrs || {});
  }

  /**
   * Returns the CSS class for the mark.
   * @returns {string} The CSS class.
   */
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

  /**
   * Returns HTML attributes for the mark.
   * @returns {Object} An object containing HTML attributes.
   */
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

  /**
   * Returns the appropriate HTML tag for the mark.
   * @returns {string} The HTML tag.
   */
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

// :: MARKSET

/**
 * Represents a set of marks.
 */
class MarkSet {
  /**
   * Creates a new set of marks.
   * @param {Array<Mark>} [marks=[]] - The marks in the set.
   */
  constructor(marks = []) {
    this.marks = marks;
  }

  /**
   * Adds a mark to the set if it's not already present.
   * @param {Mark} mark - The mark to add.
   * @returns {MarkSet} A new mark set with the added mark.
   */
  add(mark) {
    for (const existing of this.marks) {
      if (existing.eq(mark)) {
        return this;
      }
    }

    return new MarkSet([...this.marks, mark]);
  }

  /**
   * Removes a mark from the set.
   * @param {Mark} mark - The mark to remove.
   * @returns {MarkSet} A new mark set without the removed mark.
   */
  remove(mark) {
    const filtered = this.marks.filter(existing => !existing.eq(mark));
    return new MarkSet(filtered);
  }

  /**
   * Checks if the set contains a specific mark.
   * @param {Mark} mark - The mark to check for.
   * @returns {boolean} True if the mark is in the set, false otherwise.
   */
  contains(mark) {
    return this.marks.some(existing => existing.eq(mark));
  }

  /**
   * Checks if this set is equal to another set.
   * @param {MarkSet} other - The other mark set to compare.
   * @returns {boolean} True if the sets are equal, false otherwise.
   */
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

  /**
   * Returns the marks as an array.
   * @returns {Array<Mark>} The array of marks.
   */
  toArray() {
    return [...this.marks];
  }

  /**
   * Creates an empty mark set.
   * @returns {MarkSet} A new empty mark set.
   */
  static empty() {
    return new MarkSet([]);
  }

  /**
   * Creates a mark set from an array of marks.
   * @param {Array<Mark>} marks - The marks to include in the set.
   * @returns {MarkSet} A new mark set.
   */
  static from(marks) {
    return new MarkSet(marks);
  }
}

// :: PARSER

/**
 * Parses Markdown text into a document model.
 */
class MarkdownParser {
  /**
   * Initializes the parser with rules and patterns.
   */
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

  /**
   * Parses the given Markdown text into a document.
   * @param {string} markdown - The Markdown text to parse.
   * @returns {Doc} The parsed document.
   */
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

  /**
   * Matches a block rule against the current line.
   * @param {string} line - The current line.
   * @param {Array<string>} lines - The array of all lines.
   * @param {number} index - The current index in the lines array.
   * @returns {Object|null} The matched block or null.
   */
  matchBlockRule(line, lines, index) {
    for (const rule of this.blockRules) {
      const match = rule.test(line, lines, index);
      if (match) {
        return match;
      }
    }
    return null;
  }

  /**
   * Parses inline content into nodes.
   * @param {string} text - The text to parse.
   * @returns {Array<DocNode>} The parsed nodes.
   */
  parseInlineContent(text) {
    if (!text || typeof text !== 'string') {
      return [DocNode.text('')];
    }

    const tokens = this.tokenizeInline(text);
    return this.tokensToNodes(tokens);
  }

  /**
   * Converts tokens to nodes.
   * @param {Array<Object>} tokens - The tokens to convert.
   * @returns {Array<DocNode>} The corresponding nodes.
   */
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

  /**
   * Tokenizes inline text into marks and text.
   * @param {string} text - The text to tokenize.
   * @returns {Array<Object>} The tokens.
   */
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

  /**
   * Converts a parsed block to a node.
   * @param {Object} block - The parsed block.
   * @returns {DocNode|null} The corresponding node or null.
   */
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

  /**
   * Parses an array of lines into blocks.
   * @param {Array<string>} lines - The lines to parse.
   * @returns {Array<Object>} The parsed blocks.
   */
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

// :: RENDERER

/**
 * Renders the document model into HTML.
 */
class MarkdownRenderer {
  /**
   * Initializes the renderer.
   * @param {Editor} editor - The editor instance.
   * @param {Object} [options={}] - Rendering options.
   */
  constructor(editor, options = {}) {
    this.cursorPosition = options.cursorPosition || null;
    this.selection = options.selection || null;
    this.syntaxElements = new Map() // track syntax elements for showing/hiding
    this.nodeElements = new Map()
    this.editor = editor;
  }

  /**
   * Renders the document into the specified container.
   * @param {Doc} doc - The document to render.
   * @param {HTMLElement} container - The container element.
   * @param {number} [cursorPosition=null] - The cursor position.
   * @param {Object} [selection=null] - The selection object.
   * @returns {HTMLElement} The container element.
   */
  render(doc, container, cursorPosition = null, selection = null) {
    this.cursorPosition = cursorPosition;
    this.selection = selection;

    if (!container) {
      throw new Error("Container element is required for rendering.");
    }

    container.innerHTML = '';
    this.syntaxElements.clear();
    this.nodeElements.clear();

    doc.content.forEach((node, index) => {
      const element = this.renderNode(node, { path: [index] });
      if (element) {
        container.appendChild(element);
      }
    })

    this.updateSyntaxVisibility();
    return container;
  }

  /**
   * Renders a single node.
   * @param {DocNode} node - The node to render.
   * @param {Object} context - The rendering context.
   * @returns {HTMLElement|null} The rendered element or null.
   */
  renderNode(node, context = {}) {
    switch (node.type) {
      case 'text':
        return this.renderTextNode(node, context);

      case 'paragraph':
        return this.renderParagraph(node, context);

      case 'heading':
        return this.renderHeading(node, context);

      case 'code_block':
        return this.renderCodeBlock(node, context);

      case 'blockquote':
        return this.renderBlockquote(node, context);

      case 'list_item':
        return this.renderListItem(node, context);

      case 'ordered_list':
        return this.renderOrderedList(node, context);

      case 'bullet_list':
        return this.renderBulletList(node, context);

      case 'image':
        return this.renderImage(node, context);

      case 'horizontal_rule':
        return this.renderHorizontalRule();

      default:
        console.warn(`Unknown node type: ${node.type}`);
        return null;
    }
  }

  /**
   * Creates an HTML element for a mark.
   * @param {Mark} mark - The mark to create an element for.
   * @param {object} context - The context.
   * @returns {HTMLElement} The created element.
   */
  createMarkElement(mark, context) {
    const element = document.createElement(mark.getHTMLTag());
    const cssc = mark.getCSSClass();
    if (cssc) {
      element.classList.add(cssc);
    }

    const attrs = mark.getHTMLAttrs();
    Object.entries(attrs).forEach(([key, value]) => {
      if (value) {
        element.setAttribute(key, value);
      }
    })

    return element;
  }

  /**
   * Applies marks to a text node.
   * @param {string} text - The text content.
   * @param {Array<Mark>} marks - The marks to apply.
   * @param {object} context - The rendering context.
   */
  applyMarks(text, marks, context) {
    let element = document.createTextNode(text);
    for (const mark of marks) {
      const wrapper = this.createMarkElement(mark, context);
      wrapper.appendChild(element);
      element = wrapper;
    }

    return element;
  }

  /**
   * Renders a text node.
   * @param {DocNode} node - The text node to render.
   * @param {object} context - The rendering context.
   * @returns {HTMLElement} The rendered text element.
   */
  renderTextNode(node, context) {
    let element
    if (node.marks && node.marks.length > 0) {
      element = this.applyMarks(node.content, node.marks, context);
    } else {
      // plain text
      element = document.createTextNode(node.content || '');
    }

    this.nodeElements.set(node, element);
    return element;
  }

  /** 
   * Renders a paragraph node.
   * @param {DocNode} node - The paragraph node to render.
   * @param {object} context - The rendering context.
   * @returns {HTMLElement} The rendered paragraph element. 
   */
  renderParagraph(node, context) {
    const { path = [] } = context;
    const element = document.createElement('p');
    element.classList.add('paragraph');

    if (Array.isArray(node.content)) {
      node.content.forEach((childNode, index) => {
        const childElement = this.renderNode(childNode, { path: [...path, index] });
        if (childElement) {
          element.appendChild(childElement);
        }
      });
    }

    this.nodeElements.set(node, element);
    return element
  }

  /**        
    * Renders a heading node.
    * @param {DocNode} node - The heading node to render.
    * @param {object} context - The rendering context.
    * @returns {HTMLElement} The rendered heading element. 
   */
  renderHeading(node, context) {
    const { path = [] } = context;
    const level = node.attrs.level || 1;
    const element = document.createElement(`h${level}`);
    element.classList.add('heading', `heading-${level}`);

    const syntaxElement = document.createElement('span');
    syntaxElement.classList.add('syntax', 'heading-syntax');
    syntaxElement.textContent = '#'.repeat(level) + ' ';

    this.syntaxElements.set(syntaxElement, {
      type: 'heading',
      level: level,
      path: path
    })

    element.appendChild(syntaxElement);
    if (Array.isArray(node.content)) {
      node.content.forEach((child, index) => {
        const childElement = this.renderNode(child, {
          path: [...path, index]
        });
        if (childElement) {
          element.appendChild(childElement);
        }
      });
    }

    this.nodeElements.set(node, element);
    return element;
  }

  /**        
    * Renders a codeblock.
    * @param {DocNode} node - The codeblock to render.
    * @param {object} context - The rendering context.
    * @returns {HTMLElement} The rendered heading element. 
   */
  renderCodeBlock(node, context) {
    const { path = [] } = context;
    const pre = document.createElement('pre');
    const code = document.createElement('code');

    pre.classList.add('code-block');
    code.classList.add('code-block-content');

    if (node.attrs.language) {
      code.classList.add(`language-${node.attrs.language}`);
    }

    const openSyntax = document.createElement('div');
    openSyntax.classList.add('syntax', 'code-block-syntax', 'code-block-open');
    openSyntax.textContent = '```' + (node.attrs.language || '');

    const closeSyntax = document.createElement('div');
    closeSyntax.classList.add('syntax', 'code-block-syntax', 'code-block-close');
    closeSyntax.textContent = '```';

    this.syntaxElements.set(openSyntax, {
      type: 'code_block',
      position: 'open',
      path: path
    });
    this.syntaxElements.set(closeSyntax, {
      type: 'code_block',
      position: 'close',
      path: path
    });

    if (Array.isArray(node.content)) {
      node.content.forEach((child, index) => {
        const childElement = this.renderNode(child, {
          path: [...path, index]
        });
        if (childElement) {
          code.appendChild(childElement);
        }
      });
    }

    pre.appendChild(openSyntax);
    pre.appendChild(code);
    pre.appendChild(closeSyntax);

    this.nodeElements.set(node, pre);
    return pre;
  }

  /**        
    * Renders a blockquotes.
    * @param {DocNode} node - The blockquote to render.
    * @param {object} context - The rendering context.
    * @returns {HTMLElement} The rendered heading element. 
   */
  renderBlockquote(node, context) {
    const { path = [] } = context;
    const element = document.createElement('blockquote');
    element.classList.add('blockquote');

    if (Array.isArray(node.content)) {
      node.content.forEach((child, index) => {
        const wrapper = document.createElement('div');
        wrapper.classList.add('blockquote-line');

        const syntaxElement = document.createElement('span');
        syntaxElement.classList.add('syntax', 'blockquote-syntax');
        syntaxElement.textContent = '> ';

        this.syntaxElements.set(syntaxElement, {
          type: 'blockquote',
          path: [...path, index]
        });

        wrapper.appendChild(syntaxElement);

        const childElement = this.renderNode(child, {
          path: [...path, index]
        });
        if (childElement) {
          wrapper.appendChild(childElement);
        }

        element.appendChild(wrapper);
      });
    }

    this.nodeElements.set(node, element);
    return element;
  }

  /**        
    * Renders a ordered list.
    * @param {DocNode} node - The ordered list to render.
    * @param {object} context - The rendering context.
    * @returns {HTMLElement} The rendered heading element. 
 */
  renderOrderedList(node, context) {
    const { path = [] } = context;
    const element = document.createElement('ol');
    element.classList.add('ordered-list');

    if (Array.isArray(node.content)) {
      node.content.forEach((child, index) => {
        const childElement = this.renderNode(child, {
          path: [...path, index]
        });
        if (childElement) {
          element.appendChild(childElement);
        }
      });
    }

    this.nodeElements.set(node, element);
    return element;
  }

  /**        
    * Renders an unordered list.
    * @param {DocNode} node - The unordered list to render.
    * @param {object} context - The rendering context.
    * @returns {HTMLElement} The rendered heading element. 
 */
  renderListItem(node, context) {
    const { path = [] } = context;
    const element = document.createElement('li');
    element.classList.add('list-item');

    const parentPath = path.slice(0, -1);
    const syntaxElement = document.createElement('span');
    syntaxElement.classList.add('syntax', 'list-syntax');

    this.syntaxElements.set(syntaxElement, {
      type: 'list_item',
      path: path
    });

    element.appendChild(syntaxElement);

    if (Array.isArray(node.content)) {
      node.content.forEach((child, index) => {
        const childElement = this.renderNode(child, {
          path: [...path, index]
        });
        if (childElement) {
          element.appendChild(childElement);
        }
      });
    }

    this.nodeElements.set(node, element);
    return element;
  }


  /**        
      * Renders an image.
      * @param {DocNode} node - The image to render.
      * @param {object} context - The rendering context.
      * @returns {HTMLElement} The rendered heading element. 
   */
  renderImage(node, context) {
    const { path = [] } = context;
    const wrapper = document.createElement('span');
    wrapper.classList.add('image-wrapper');

    if (this.shouldShowSyntax(path)) {
      const syntaxElement = document.createElement('span');
      syntaxElement.classList.add('syntax', 'image-syntax');
      syntaxElement.textContent = `![${node.attrs.alt || ''}](${node.attrs.src}${node.attrs.title ? ` "${node.attrs.title}"` : ''})`;

      this.syntaxElements.set(syntaxElement, {
        type: 'image',
        path: path
      });

      wrapper.appendChild(syntaxElement);
    } else {
      const img = document.createElement('img');
      img.src = node.attrs.src;
      img.alt = node.attrs.alt || '';
      if (node.attrs.title) {
        img.title = node.attrs.title;
      }
      img.classList.add('image');
      wrapper.appendChild(img);
    }

    this.nodeElements.set(node, wrapper);
    return wrapper;
  }


  /**        
      * Renders a horizontal rule.
      * @param {DocNode} node - The horizonal rule to render.
      * @param {object} context - The rendering context.
      * @returns {HTMLElement} The rendered heading element. 
   */
  renderHorizontalRule(node, context = {}) {
    const { path = [] } = context;
    const wrapper = document.createElement('div');
    wrapper.classList.add('horizontal-rule-wrapper');

    if (this.shouldShowSyntax(path)) {
      const syntaxElement = document.createElement('span');
      syntaxElement.classList.add('syntax', 'hr-syntax');
      syntaxElement.textContent = '---';

      this.syntaxElements.set(syntaxElement, {
        type: 'horizontal_rule',
        path: path
      });

      wrapper.appendChild(syntaxElement);
    } else {
      const hr = document.createElement('hr');
      hr.classList.add('horizontal-rule');
      wrapper.appendChild(hr);
    }

    this.nodeElements.set(node, wrapper);
    return wrapper;
  }

  /**
   * Updates the visibility of syntax elements based on cursor position and selection.
   */
  updateSyntaxVisibility() {
    this.syntaxElements.forEach((info, element) => {
      const shouldShow = this.shouldShowSyntax(info.path);
      element.style.display = shouldShow ? 'inline' : 'none';
    });
  }

  /** 
   * Checks if syntax should be shown for a given path.
   * @param {Array<number>} path - The path to check.
   * @return {boolean} True if syntax should be shown, false otherwise.
   */
  shouldShowSyntax(path) {
    if (this.cursorPosition === null) {
      return false;
    }

    const node = this.editor.doc.getNodeAtPath(path);
    if (!node) return false;

    const nodeStart = this.editor.doc.getNodeStartPosition(node);
    const nodeEnd = nodeStart + node.nodeSize()
    if (this.cursorPosition >= nodeStart && this.cursorPosition <= nodeEnd) {
      return true;
    }

    // TODO: Check if selection intersects with the node and if it does, show syntax
  }

  /**
   * Set cursor position for syntax visibility.
    * @param {number} position - The cursor position.
   */
  setCursorPosition(position) {
    this.cursorPosition = position;
    this.updateSyntaxVisibility();
  }

  /**
   * Set selection for syntax visibility.
   * @param {Object} selection - The selection object.
   */
  setSelection(selection) {
    this.selection = selection;
    this.updateSyntaxVisibility();
  }
}

// :: SELECTION


// :: CURSOR

// :: TRANSACTION

class Editor {
  constructor(element) {
    this.element = element;
    this.parser = new MarkdownParser();
    this.doc = Doc.empty();

    this.init()
  }

  init() {
    this.renderer = new MarkdownRenderer(this);
  }

  example(markdown_string) {
    this.doc = this.parser.parse(markdown_string);
    let rendered = this.renderer.render(this.doc, this.element, null, null);

    console.log(rendered.outerHTML);
  }
}

const MD = `
# heading
asldfhadsj [asdf](https://x.com)

> blockquote

\`\`\`js
console.log("Hello, world!");
\`\`\`

---
`

const newdiv = document.createElement("div");

const editor = new Editor(newdiv);
editor.example(MD);
