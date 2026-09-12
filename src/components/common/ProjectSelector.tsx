import React from 'react';
import { Project } from '../../types';
import { CustomSelect, SelectOption } from './CustomSelect';
import { FolderKanban, Inbox } from 'lucide-react';

interface ProjectSelectorProps {
  projects: Project[];
  value: string;
  onChange: (projectId: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  error?: string;
}

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  projects,
  value,
  onChange,
  label = 'پروژه مرتبط',
  placeholder = 'انتخاب پروژه...',
  className = '',
  error,
}) => {
  const options: SelectOption[] = [
    {
      value: '',
      label: 'بدون پروژه (وظیفه آزاد)',
      icon: <Inbox className="w-4 h-4" />,
      description: 'وظیفه در لیست عمومی وظایف قرار می‌گیرد',
    },
    ...projects.map((p) => ({
      value: p.id,
      label: p.name,
      color: p.color || '#8b5cf6',
      icon: <FolderKanban className="w-4 h-4" />,
      badge: p.status === 'completed' ? 'تکمیل شده' : undefined,
      description: p.description ? p.description.slice(0, 30) + '...' : undefined,
    })),
  ];

  return (
    <CustomSelect
      options={options}
      value={value}
      onChange={onChange}
      label={label}
      placeholder={placeholder}
      className={className}
      error={error}
      searchable={projects.length > 3}
    />
  );
};
