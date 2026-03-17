import { useState } from 'react';
import { Modal, Button } from 'antd';

const NotifyBanner = () => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  return (
    <div>
      <Modal
        title={null}
        footer={(<Button type="primary" onClick={() => setIsOpen(false)}>Confirmed</Button>)}
        width={770}
        visible={isOpen}
        closable={false}
        className="notify-banner"
        style={{
          paddingBottom: 100
        }}
      >
        <ul>
          <li>
            StunnerZ is an adult-friendly, platform that gives to the Creators 85% commission, forever!
          </li>
          <li>
            Referring other Creators provides you an additional 3% of their total revenue! No charge to them, we pay you!
          </li>
          <li>
            StunnerZ gives you a broad set of advanced features to earn money from subscriptions, “un-capped” prices for PPV, Tips, paid Live Streaming and selling through DM or selling physical and digital products
          </li>
          <li>
            Secure! We DO NOT need and don&apos;t keep your Personal Information or credit card details
          </li>
        </ul>
        <p>To setup an account, you need:</p>
        <ul>
          <li>A photo for the profile</li>
          <li>
            Id card, passport or driving licence
          </li>
          <li>
            Your bank account details to receive the money from StunnerZ – but don&apos;t worry if you don&apos;t have it, we offer the option to open a new and dedicated bank account
          </li>
        </ul>
        <p>2 EASY STEPS to activate your account</p>
        <ol>
          {/* <li>
            Fill the mandatory fields below and add the profile photo by clicking the camera logo on the circle
          </li> */}
          <li>
            Set up your banking
          </li>
          <li>
            Verify your ID
          </li>
        </ol>
        <p className="text-center bolder">The account activation process must be completed within 15 days or will be automatically deleted.</p>
      </Modal>
    </div>
  );
};

export default NotifyBanner;
