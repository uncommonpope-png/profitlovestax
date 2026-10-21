import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
  "label": "Hello",
  "variant": "Hello",
  "disabled": false
}
};

export const labelStory: Story = {
  args: {"label":"label value","variant":"Hello","disabled":false}
};

export const variantStory: Story = {
  args: {"label":"Hello","variant":"variant value","disabled":false}
};

export const disabledStory: Story = {
  args: {"label":"Hello","variant":"Hello","disabled":true}
};
