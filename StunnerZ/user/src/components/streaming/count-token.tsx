import { useEffect, useState } from "react";
import { WalletIcon } from "src/icons";

type IProps = {
	start: boolean;
	priceDefault: number;
};

export default function CountTokenInPrivateStream({ start, priceDefault }: IProps) {
  const [tokenSpent, setTokenSpent] = useState<number>(priceDefault || 0);

	useEffect(() => {
    if(start === true) {
      setTimeout(() => {
        setTokenSpent(tokenSpent + Number(priceDefault));
      }, 60000);
    }
    const walletElement = document.querySelector('.custom-wallet-number');
    if (walletElement) {
      walletElement.innerHTML = `$${tokenSpent.toFixed(2)}`;
    }
  }, [start, tokenSpent]);
	return (
		<div className="custom-wallet">
			<WalletIcon />
			{' '}
			<span className="custom-wallet-number" />
		</div>
	)
}