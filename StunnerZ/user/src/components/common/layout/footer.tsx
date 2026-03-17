import { PureComponent } from "react";
import Link from "next/link";
import { connect } from "react-redux";
import { IUIConfig } from "src/interfaces";
import { withRouter, NextRouter } from "next/router";

interface IProps {
  ui: IUIConfig;
  router: NextRouter;
  customId?: string;
}
class Footer extends PureComponent<IProps> {
  render() {
    const { ui, router, customId } = this.props;
    const menus =
      ui.menus && ui.menus.length > 0
        ? ui.menus.filter((m) => m.section === "footer")
        : [];
    return (
      <div className="main-footer" id={customId || "main-footer"}>
        <div className="main-container">
          <ul>
            <li>
              <Link href="/">
                <a>Home</a>
              </Link>
            </li>
            <li>
              <Link href="/creator">
                <a>Creators</a>
              </Link>
            </li>
            <li>
              <Link href="/contact">
                <a>Contact</a>
              </Link>
            </li>
            <li>
              <Link href="/page/affiliate-program">
                <a>Affiliate Program</a>
              </Link>
            </li>
            <li>
              <a
                href="https://stunnerz.freshdesk.com/support/solutions"
                rel="noreferrer"
                target="_blank"
              >
                Support
              </a>
            </li>
            {/* {!currentUser._id ? linkAuth : null} */}
          </ul>
          {menus && menus.length > 0 && (
            <ul>
              {menus &&
                menus.length > 0 &&
                menus.map((item) => (
                  <li
                    key={item._id}
                    className={router.pathname === item.path ? "active" : ""}
                  >
                    <a
                      rel="noreferrer"
                      href={item.path}
                      target={item.isNewTab ? "_blank" : ""}
                    >
                      {item.title}
                    </a>
                  </li>
                ))}
            </ul>
          )}
          {ui.footerContent ? (
            <div
              className="footer-content"
              dangerouslySetInnerHTML={{ __html: ui.footerContent }}
            />
          ) : (
            <div className="copyright-text">
              <span>
                <Link href="/">
                  <a>{ui?.siteName}</a>
                </Link>{" "}
                © Copyright {new Date().getFullYear()}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
}
const mapState = (state: any) => ({
  ui: { ...state.ui },
});
export default withRouter(connect(mapState)(Footer)) as any;
