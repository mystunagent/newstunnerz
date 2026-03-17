import { Button } from "antd";
import Router, { useRouter } from "next/router";
import "./header.less";

export default function BtnHeaderLogin() {
	const params = useRouter();
	const rel = params.query?.rel;
  return (
    <div className="nav-btn">
      <Button
        type="primary"
        onClick={() =>
          rel
            ? Router.push({
                pathname: "/auth/creator-register",
                query: { rel },
              })
            : Router.push("/auth/creator-register")
        }
      >
        Join as Creator
      </Button>
      <Button
        type="primary"
        className="btn-bue"
        onClick={() =>
          rel
            ? Router.push({
                pathname: "/auth/fan-register",
                query: { rel },
              })
            : Router.push("/auth/fan-register")
        }
      >
        Join as Guest
      </Button>
    </div>
  );
}
