import React, { useMemo } from 'react'
import { ReactEditor, useEditor } from 'slate-react'
import { Range, Editor, Transforms, Element } from 'slate'
import FileToolbar from './file-toolbar'
import DropDownMenu from './drop-down-menu'
import FormatMenu from './format-menu'

const isInsertDisabledForItem = (selectedNodes, name, selection) => {
	if (!selection) return true

	for (const [node] of selectedNodes) {
		switch (node.type) {
			case 'ObojoboDraft.Chunks.Table':
				return true

			case 'ObojoboDraft.Chunks.Question':
				return name === 'Question' || name === 'Question Bank'
		}
	}

	return false
}

const containsFigureNode = selectedNodes => {
	for (const [node] of selectedNodes) {
		if (node.type === 'ObojoboDraft.Chunks.Figure') {
			return true
		}
	}

	return false
}

const selectAll = editor => {
	const edges = Editor.edges(editor, [])
	Transforms.select(editor, { focus: edges[0], anchor: edges[1] })
	return ReactEditor.focus(editor)
}

const FileToolbarViewer = props => {
	const { insertableItems, ...filteredProps } = props
	const editor = useEditor()
	const sel = editor.selection
	const hasSelection = sel && Range.isCollapsed(sel)
	const selectionKey = sel ? sel.anchor.path.join() + '-' + sel.focus.path.join() : 0
	const insertMenu = useMemo(() => {
		// If the selected area spans across multiple blocks, the selection is deleted before
		// inserting, colapsing it down to the type of the first block
		const selectedNodes = (() => {
			if (!editor.selection) return []
			return Array.from(
				Editor.nodes(editor, {
					at: Editor.path(editor, editor.selection, { edge: 'start' }),
					match: node => Element.isElement(node) && !editor.isInline(node) && !node.subtype
				})
			)
		})()

		const insertMenuItems = insertableItems.map(item => {
			return {
				name: item.name,
				action: () => {
					const endPath = Editor.path(editor, editor.selection, { edge: 'start' })

					// If the current selection is a figure, insert the new item at
					// the end of the figure. Inserting an item while in a figure caption
					// duplicates the figure.
					if (containsFigureNode(selectedNodes)) {
						Transforms.insertNodes(editor, item.cloneBlankNode(), {
							at: Editor.end(editor, endPath)
						})
					} else {
						Transforms.insertNodes(editor, item.cloneBlankNode())
					}
					ReactEditor.focus(editor)
				},
				disabled: isInsertDisabledForItem(selectedNodes, item.name, sel)
			}
		})

		return (
			<div className="visual-editor--drop-down-menu">
				<DropDownMenu name="Insert" menu={insertMenuItems} />
			</div>
		)
	}, [selectionKey])

	return (
		<FileToolbar
			{...filteredProps}
			editor={editor}
			selectionKey={selectionKey}
			insertMenu={insertMenu}
			formatMenu={<FormatMenu hasSelection={hasSelection} />}
			selectAll={selectAll}
			isDeletable={hasSelection}
		/>
	)
}

export default FileToolbarViewer
