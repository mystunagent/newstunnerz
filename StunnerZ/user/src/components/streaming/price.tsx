type Props = {
  amount: any;
  text?: string;
};

function Price({
  amount, text
}: Props) {
  let a = amount;
  if (typeof amount === 'string') parseFloat(amount);
  else if (!amount) a = 0;

  return <span>{`$${(a || 0).toFixed(2)} ${text}`}</span>;
}

export default Price;
