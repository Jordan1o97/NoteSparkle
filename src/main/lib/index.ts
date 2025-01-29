import { appDirectoryName, fileEncoding } from '@shared/constants'
import { NoteInfo } from '@shared/models'
import { CreateNote, DeleteNote, GetNotes, ReadNotes, WriteNote } from '@shared/types'
import { dialog } from 'electron'
import { ensureDir, readFile, remove, stat, writeFile } from 'fs-extra'
import { readdir } from 'fs/promises'
import { homedir } from 'os'
import path from 'path'
//import welcomeNoteFile from '../../../resources/welcome.md?asset'

export const getRootDir = () => {
  return `${homedir()}/${appDirectoryName}`
}

export const getNotes: GetNotes = async () => {
  const rootDir = getRootDir()

  await ensureDir(rootDir)

  const noteFileNames = await readdir(rootDir, {
    withFileTypes: false,
    encoding: fileEncoding
  })

  const notes = noteFileNames.filter((fileName) => fileName.endsWith('.md'))

  // if (isEmpty(notes)) {
  //   console.info('No notes found, creating welcome note')

  //   const content = await readFile(welcomeNoteFile, { encoding: fileEncoding })

  //   await writeFile(`${rootDir}/${welcomeNoteName}`, content, { encoding: fileEncoding })

  //   notes.push(welcomeNoteName)
  // }

  return Promise.all(notes.map(getNoteInfoFromFilename))
}

export const getNoteInfoFromFilename = async (fileName: string): Promise<NoteInfo> => {
  const fileStats = await stat(`${getRootDir()}/${fileName}`)

  return {
    title: fileName.replace(/\.md$/, ''),
    lastEditTime: fileStats.mtimeMs
  }
}

export const readNote: ReadNotes = async (filename) => {
  const rootDir = getRootDir()

  return readFile(`${rootDir}/${filename}.md`, { encoding: fileEncoding })
}

export const writeNote: WriteNote = async (filename, content) => {
  const rootDir = getRootDir()

  console.info(`Writing note ${filename}`)

  return writeFile(`${rootDir}/${filename}.md`, content, { encoding: fileEncoding })
}

export const createNote: CreateNote = async () => {
  const rootDir = getRootDir()

  await ensureDir(rootDir)

  const { filePath, canceled } = await dialog.showSaveDialog({
    title: 'New Note',
    defaultPath: `${rootDir}/Untitled.md`,
    buttonLabel: 'Create',
    properties: ['showOverwriteConfirmation'],
    showsTagField: false,
    filters: [{ name: 'Markdown', extensions: ['md'] }]
  })

  if (canceled || !filePath) {
    console.info('Note creation canceled')
    return false
  }

  const { name: fileName, dir: parentDir } = path.parse(filePath)

  if (parentDir !== rootDir) {
    await dialog.showMessageBox({
      type: 'error',
      title: 'Invalid Directory',
      message: `Notes must be saved in the ${rootDir} directory.\n Avoid using other directories`,
      buttons: ['OK']
    })

    return false
  }

  console.info(`Creating note ${fileName}`)
  await writeFile(filePath, '')

  return fileName
}

export const deleteNote: DeleteNote = async (filename) => {
  const rootDir = getRootDir()

  const { response } = await dialog.showMessageBox({
    type: 'warning',
    title: 'Delete Note',
    message: `Are you sure you want to delete ${filename}?`,
    buttons: ['Delete', 'Cancel'], //0 D 1 C
    defaultId: 1,
    cancelId: 1
  })

  if (response === 1) {
    console.info('Note deletion canceled')
    return false
  }

  console.info(`Deleting note ${filename}`)

  await remove(`${rootDir}/${filename}.md`)
  return true
}
