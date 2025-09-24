import { readFile, pathExists } from 'fs-extra'
import { join } from 'path'
import { Logger } from '../../utils/logger'
import { ValidationError } from '../types'

export interface ParsedTask {
  id: string
  name: string
  description: string
  sessionName: string
  section: TaskSection
  priority: TaskPriority
  status: TaskStatus
  context: TaskContext
  metadata: TaskMetadata
}

export interface TaskContext {
  fullDescription: string
  technicalDetails?: string
  dependencies?: string[]
  acceptanceCriteria?: string[]
  notes?: string[]
}

export interface TaskMetadata {
  lineNumber: number
  rawText: string
  estimatedTime?: string
  tags?: string[]
}

export enum TaskSection {
  SESSION_TASKS = 'session-tasks',
  IN_PROGRESS = 'in-progress', 
  BLOCKED = 'blocked',
  QUALITY_CHECKLIST = 'quality-checklist',
  OTHER = 'other'
}

export enum TaskPriority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  BLOCKED = 'blocked',
  COMPLETED = 'completed'
}

export interface TodoFileMetadata {
  filePath: string
  lastModified: Date
  totalTasks: number
  sections: string[]
  sessionName?: string
  projectContext?: string
}

export class TodoFileParser {
  private logger: Logger

  constructor(logger: Logger) {
    this.logger = logger
  }

  /**
   * Parse tazz-todo.md file and extract structured task information
   */
  async parseFile(projectPath: string): Promise<{
    tasks: ParsedTask[]
    metadata: TodoFileMetadata
  }> {
    const todoFilePath = join(projectPath, '.tazz', 'tazz-todo.md')
    
    if (!await pathExists(todoFilePath)) {
      throw new ValidationError('tazz-todo.md file not found. Run "tazz note" to create it first.', {
        filePath: todoFilePath
      })
    }

    try {
      const content = await readFile(todoFilePath, 'utf-8')
      const tasks = this.parseMarkdownContent(content)
      
      const stats = await import('fs-extra').then(fs => fs.stat(todoFilePath))
      
      const metadata: TodoFileMetadata = {
        filePath: todoFilePath,
        lastModified: stats.mtime,
        totalTasks: tasks.length,
        sections: this.extractSections(content),
        sessionName: this.extractSessionName(content),
        projectContext: this.extractProjectContext(content)
      }

      this.logger.info('Parsed todo file successfully', {
        filePath: todoFilePath,
        taskCount: tasks.length,
        sections: metadata.sections
      })

      return { tasks, metadata }

    } catch (error) {
      this.logger.error('Failed to parse todo file', error as Error, { filePath: todoFilePath })
      throw new ValidationError(`Failed to parse todo file: ${(error as Error).message}`, {
        filePath: todoFilePath
      }, error as Error)
    }
  }

  /**
   * Parse markdown content and extract tasks
   */
  private parseMarkdownContent(content: string): ParsedTask[] {
    const lines = content.split('\n')
    const tasks: ParsedTask[] = []
    let currentSection = TaskSection.OTHER
    let lineNumber = 0

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      lineNumber = i + 1

      // Check for section headers
      const sectionMatch = this.detectSection(line)
      if (sectionMatch) {
        currentSection = sectionMatch
        continue
      }

      // Check for task items
      const taskMatch = line.match(/^[\s]*-\s*\[\s*([x\s])\s*\]\s*(.+)$/)
      if (taskMatch) {
        const isCompleted = taskMatch[1].toLowerCase() === 'x'
        const taskContent = taskMatch[2].trim()
        
        // Parse task details from following lines
        const taskDetails = this.parseTaskDetails(lines, i + 1)
        
        // Extract task name and description from the task line
        const { name, description } = this.parseTaskLine(taskContent)
        
        const task: ParsedTask = {
          id: this.generateTaskId(name, lineNumber),
          name,
          description: description || taskDetails.description || `Work on: ${name}`,
          sessionName: taskDetails.sessionName || this.sanitizeSessionName(name),
          section: currentSection,
          priority: this.determinePriority(taskContent, taskDetails),
          status: isCompleted ? TaskStatus.COMPLETED : this.determineStatus(currentSection),
          context: {
            fullDescription: this.buildFullDescription(name, description, taskDetails),
            technicalDetails: taskDetails.technicalDetails,
            dependencies: taskDetails.dependencies,
            acceptanceCriteria: taskDetails.acceptanceCriteria,
            notes: taskDetails.notes
          },
          metadata: {
            lineNumber,
            rawText: line,
            estimatedTime: taskDetails.estimatedTime,
            tags: this.extractTags(taskContent)
          }
        }

        tasks.push(task)
        
        // Skip processed lines
        i += taskDetails.linesProcessed
      }
    }

    // Filter out completed and blocked tasks for execution
    const executableTasks = tasks.filter(task => 
      task.status !== TaskStatus.COMPLETED && 
      task.status !== TaskStatus.BLOCKED
    )

    this.logger.debug('Parsed tasks', {
      totalTasks: tasks.length,
      executableTasks: executableTasks.length,
      sections: [...new Set(tasks.map(t => t.section))]
    })

    return executableTasks
  }

  /**
   * Parse additional task details from subsequent lines
   */
  private parseTaskDetails(lines: string[], startIndex: number): {
    sessionName: string
    description: string
    technicalDetails?: string
    dependencies?: string[]
    acceptanceCriteria?: string[]
    notes?: string[]
    estimatedTime?: string
    linesProcessed: number
  } {
    let sessionName = ''
    let description = ''
    let technicalDetails = ''
    let dependencies: string[] = []
    let acceptanceCriteria: string[] = []
    let notes: string[] = []
    let estimatedTime = ''
    let linesProcessed = 0

    let currentField = ''
    let i = startIndex

    while (i < lines.length && lines[i].trim() !== '' && !lines[i].match(/^[\s]*-\s*\[/)) {
      const line = lines[i].trim()
      linesProcessed++

      // Check for specific field markers
      const sessionMatch = line.match(/^Session name:\s*(.+)/i)
      const descMatch = line.match(/^Description:\s*(.*)$/i)
      const techMatch = line.match(/^Technical:\s*(.*)$/i)
      const depMatch = line.match(/^Dependencies:\s*(.*)$/i)
      const accMatch = line.match(/^Acceptance:\s*(.*)$/i)
      const noteMatch = line.match(/^Notes:\s*(.*)$/i)
      const timeMatch = line.match(/^Time:\s*(.+)/i)
      
      if (sessionMatch) {
        sessionName = sessionMatch[1].trim()
        currentField = ''
      } else if (descMatch) {
        description = descMatch[1].trim()
        currentField = 'description'
      } else if (techMatch) {
        technicalDetails = techMatch[1].trim()
        currentField = 'technical'
      } else if (depMatch) {
        const depLine = depMatch[1].trim()
        if (depLine) dependencies.push(depLine)
        currentField = 'dependencies'
      } else if (accMatch) {
        const criteriaLine = accMatch[1].trim()
        if (criteriaLine) acceptanceCriteria.push(criteriaLine)
        currentField = 'acceptance'
      } else if (noteMatch) {
        const noteLine = noteMatch[1].trim()
        if (noteLine) notes.push(noteLine)
        currentField = 'notes'
      } else if (timeMatch) {
        estimatedTime = timeMatch[1].trim()
        currentField = ''
      } else if (line && currentField) {
        // Continue multi-line field
        switch (currentField) {
          case 'description':
            description += (description ? ' ' : '') + line
            break
          case 'technical':
            technicalDetails += (technicalDetails ? ' ' : '') + line
            break
          case 'dependencies':
            dependencies.push(line)
            break
          case 'acceptance':
            acceptanceCriteria.push(line)
            break
          case 'notes':
            notes.push(line)
            break
        }
      }

      i++
    }

    return {
      sessionName,
      description,
      technicalDetails: technicalDetails || undefined,
      dependencies: dependencies.length ? dependencies : undefined,
      acceptanceCriteria: acceptanceCriteria.length ? acceptanceCriteria : undefined,
      notes: notes.length ? notes : undefined,
      estimatedTime: estimatedTime || undefined,
      linesProcessed
    }
  }

  private detectSection(line: string): TaskSection | null {
    const trimmed = line.trim().toLowerCase()
    
    if (trimmed.includes('session tasks') || trimmed.includes('## session tasks')) {
      return TaskSection.SESSION_TASKS
    } else if (trimmed.includes('in progress') || trimmed.includes('## in progress')) {
      return TaskSection.IN_PROGRESS  
    } else if (trimmed.includes('blocked') || trimmed.includes('## blocked')) {
      return TaskSection.BLOCKED
    } else if (trimmed.includes('quality') || trimmed.includes('checklist')) {
      return TaskSection.QUALITY_CHECKLIST
    }
    
    return null
  }

  private parseTaskLine(taskContent: string): { name: string; description?: string } {
    // Handle format: "Task Name: Description"
    const colonMatch = taskContent.match(/^([^:]+):\s*(.+)$/)
    if (colonMatch) {
      return {
        name: colonMatch[1].trim(),
        description: colonMatch[2].trim()
      }
    }

    return { name: taskContent }
  }

  private buildFullDescription(name: string, description: string, details: any): string {
    let fullDesc = `Task: ${name}\n`
    
    if (description) {
      fullDesc += `Description: ${description}\n`
    }
    
    if (details.technicalDetails) {
      fullDesc += `Technical Details: ${details.technicalDetails}\n`
    }
    
    if (details.dependencies?.length) {
      fullDesc += `Dependencies: ${details.dependencies.join(', ')}\n`
    }
    
    if (details.acceptanceCriteria?.length) {
      fullDesc += `Acceptance Criteria:\n${details.acceptanceCriteria.map((c: string) => `- ${c}`).join('\n')}\n`
    }
    
    if (details.notes?.length) {
      fullDesc += `Notes:\n${details.notes.map((n: string) => `- ${n}`).join('\n')}\n`
    }

    return fullDesc.trim()
  }

  private generateTaskId(name: string, lineNumber: number): string {
    const sanitized = name.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 20)
    return `${sanitized}-${lineNumber}`
  }

  private sanitizeSessionName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 30)
  }

  private determinePriority(taskContent: string, details: any): TaskPriority {
    const text = `${taskContent} ${details.description || ''}`.toLowerCase()
    
    if (text.includes('urgent') || text.includes('critical') || text.includes('high')) {
      return TaskPriority.HIGH
    } else if (text.includes('low') || text.includes('nice to have')) {
      return TaskPriority.LOW
    }
    
    return TaskPriority.MEDIUM
  }

  private determineStatus(section: TaskSection): TaskStatus {
    switch (section) {
      case TaskSection.IN_PROGRESS:
        return TaskStatus.IN_PROGRESS
      case TaskSection.BLOCKED:
        return TaskStatus.BLOCKED
      default:
        return TaskStatus.TODO
    }
  }

  private extractTags(content: string): string[] {
    const tagMatches = content.match(/#[\w-]+/g)
    return tagMatches ? tagMatches.map(tag => tag.substring(1)) : []
  }

  private extractSections(content: string): string[] {
    const sections: string[] = []
    const lines = content.split('\n')
    
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.startsWith('##') || trimmed.startsWith('#')) {
        sections.push(trimmed.replace(/^#+\s*/, ''))
      }
    }
    
    return sections
  }

  private extractSessionName(content: string): string | undefined {
    const sessionMatch = content.match(/## Session: \[(.+?)\]/i)
    return sessionMatch ? sessionMatch[1] : undefined
  }

  private extractProjectContext(content: string): string | undefined {
    // Look for project context in the first few paragraphs
    const lines = content.split('\n')
    let context = ''
    
    for (let i = 0; i < Math.min(10, lines.length); i++) {
      const line = lines[i].trim()
      if (line && !line.startsWith('#') && !line.startsWith('-')) {
        context += line + ' '
      }
    }
    
    return context.trim() || undefined
  }
}