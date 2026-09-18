import React from 'react';

const LEVEL_CLASS = {
  subtle: 'v5-glass-subtle',
  panel: 'v5-glass-panel',
  focus: 'v5-glass-focus',
};

export default function GlassSurface({
  as: Tag = 'div',
  level = 'panel',
  className = '',
  children,
  ...props
}) {
  return (
    <Tag className={`${LEVEL_CLASS[level] || LEVEL_CLASS.panel} ${className}`} {...props}>
      {children}
    </Tag>
  );
}
