import React, { useState, Component } from 'react';
import logo from './logo.svg';
import './App.css';
import { Map } from 'immutable';
import { Modifier, Editor, EditorState, convertFromRaw } from 'draft-js'

const rawContent = {
  blocks: [{
    type: 'unstyled',
    text: 'Hello world'
  }, {
    type: 'custom',
    text: '',
    data: {
      content: EditorState.createWithContent(convertFromRaw({
        blocks: [{
          text: 'Nested One'
        }, {
          text: 'Nested Two'
        }],
        entityMap: {}
      }))
    }
  }],
  entityMap: {}
}

let editorState = EditorState.createWithContent(convertFromRaw(rawContent))
  /*
editorState.getCurrentContent().getBlockMap().filter(block => block.getType() === 'custom').forEach(block => {
  editorState = Modifier.updateBlock

  const content = editorState.getCurrentContent();

  editorState = EditorState.push(
    editorState,
    Modifier.mergeBlockData(
      content,
      editorState.getSelection().merge({ anchorKey: key, focusKey: key }),
      Map(data)
    )
  )
})
*/


const Custom = (props) => {
  const { blockProps: { readOnly, updateBlock, setReadOnly, handleHistory }, block } = props
  console.log('render custom block')

  return <div
    onMouseDown={(ev) => {
      console.log('inside')
      ev.stopPropagation()
      setReadOnly(true)
    }}

    onKeyDown={(ev) => {
      if (ev.metaKey && ev.key === 'z') {
        handleHistory(ev.shiftKey);
        ev.preventDefault();
      }
      ev.stopPropagation()
    }}
  >
      <div contentEditable={false}>
      <Editor
        editorState={block.getIn(['data', 'content'])}
        onChange={editorState => {
          console.log('inside editorState', editorState)
          updateBlock(block.getKey(), { content: editorState })
        }}
      />
    </div>
  </div>
}

class App extends Component {
  state = {
    readOnly: false,
    editorState
  }

  handleHistory = (isRedo) => {
    const { editorState } = this.state
    const method = isRedo ? EditorState.redo : EditorState.undo
    this.onChange(method(editorState))
  }

  updateBlock = (key, data) => {
    const { editorState } = this.state;
    const content = editorState.getCurrentContent();

    console.log('yo', data.content.getLastChangeType())
    const block = content.getBlockForKey(key)
    const currentContent = block.getIn(['data', 'content']);
    const newContent = Modifier.mergeBlockData(
      content,
      editorState.getSelection().merge({ anchorKey: key, focusKey: key }),
      Map(data)
    )

    if (currentContent.getCurrentContent() !== data.content.getCurrentContent()) {
      this.onChange(
        EditorState.push(
          editorState,
          newContent,
          data.content.getLastChangeType()
        )
      )
    } else {
      this.onChange(EditorState.set(editorState, { currentContent: newContent }))
    }
  }

  onChange = editorState => this.setState({ editorState })

  setReadOnly = (readOnly) => this.setState({ readOnly })

  render() {
    const { readOnly, editorState } = this.state

    console.log('editorstate', editorState.getCurrentContent().toJS())

    return (
      <div className="App" onMouseDown={(ev) => {
        console.log('outside')
        ev.stopPropagation()
        this.setState({ readOnly: false })
      }}>
        <Editor
          editorState={editorState}
          onChange={this.onChange}
          readOnly={readOnly}
          blockRendererFn={(contentBlock) => {
            if (contentBlock.getType() === 'custom') {
              return {
                component: Custom,
                editable: false,
                props: {
                  readOnly: !readOnly,
                  updateBlock: this.updateBlock,
                  setReadOnly: this.setReadOnly,
                  handleHistory: this.handleHistory
                }
              }
            }
          }}
        />
        <pre>
          Undo Stack Size: {editorState.getUndoStack().size}
        </pre>
      </div>
    );
  }
}

export default App;
