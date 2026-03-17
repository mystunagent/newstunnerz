/* eslint-disable react/require-default-props */
interface Prop {
  width?: number;
  height?: number;
}

export const PaidContentIcon = ({ ...props }: Prop) => <img {...props} src="/static/paid-content.png" alt="" />;
