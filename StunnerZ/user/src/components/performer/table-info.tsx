import { Descriptions, Collapse } from "antd";
import { PureComponent } from "react";
import { ICountry, IPerformer } from "src/interfaces";
// import { formatDateNotSecond } from '@lib/date';

interface IProps {
  performer: IPerformer;
  countries: ICountry[];
}

export class PerformerInfo extends PureComponent<IProps> {
  detectURLs(str: string) {
    if (!str) return false;
    const urlRegex = /(((https?:\/\/)|(www\.))[^\s]+)/g;
    return str.match(urlRegex);
  }

  replaceURLs(str: string) {
    if (!str) return "No bio yet";

    const urlRegex = /(((https?:\/\/)|(www\.))[^\s]+)/g;
    const result = str.replace(urlRegex, (url: string) => {
      let hyperlink = url;
      if (!hyperlink.match("^https?:\\/\\/")) {
        hyperlink = `http://${hyperlink}`;
      }
      return `<a href="${hyperlink}" target="_blank" rel="noopener noreferrer">${url}</a>`;
    });

    // eslint-disable-next-line consistent-return
    return result;
  }

  render() {
    const { performer, countries = [] } = this.props;
    const country =
      countries.length && countries.find((c) => c.code === performer?.country);

    const changeText = (text) => {
      switch (text) {
        case "a":
          return "Small";
        case "b":
          return "Medium";
        case "c":
          return "Large";
        case "d":
          return "X-Large";
        default:
          return text;
      }
    };

    return (
      <div className="per-infor">
        {performer?.country && (
          <div className="per-country">
            <img alt="flag" src={country?.flag} width="25px" />
            &nbsp;
            {country?.name}
          </div>
        )}
        <Collapse defaultActiveKey={["1"]} bordered={false} accordion>
          <Collapse.Panel header="BIOGRAPHY" key="1">
            <p
              className="bio"
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{
                __html: this.replaceURLs(performer?.bio),
              }}
            />
            <Descriptions className="performer-info">
              {performer?.gender && (
                <Descriptions.Item label="Gender">
                  {performer?.gender}
                </Descriptions.Item>
              )}
              {/* {performer?.sexualOrientation && <Descriptions.Item label="Sexual orientation">{performer?.sexualOrientation}</Descriptions.Item>} */}
              {/* {performer?.dateOfBirth && <Descriptions.Item label="Date of Birth">{formatDateNotSecond(performer?.dateOfBirth, 'DD/MM/YYYY')}</Descriptions.Item>} */}
              {performer?.bodyType && (
                <Descriptions.Item label="Body Type">
                  {performer?.bodyType}
                </Descriptions.Item>
              )}
              {/* {performer?.state && <Descriptions.Item label="State">{performer?.state}</Descriptions.Item>} */}
              {/* {performer?.city && <Descriptions.Item label="City">{performer?.city}</Descriptions.Item>} */}
              {/* {performer?.height && <Descriptions.Item label="Height">{performer?.height}</Descriptions.Item>} */}
              {/* {performer?.weight && <Descriptions.Item label="Weight">{performer?.weight}</Descriptions.Item>} */}
              {performer?.eyes && (
                <Descriptions.Item label="Eye color">
                  {performer?.eyes}
                </Descriptions.Item>
              )}
              {performer?.ethnicity && (
                <Descriptions.Item label="Ethnicity">
                  {performer?.ethnicity}
                </Descriptions.Item>
              )}
              {performer?.hair && (
                <Descriptions.Item label="Hair color">
                  {performer?.hair}
                </Descriptions.Item>
              )}
              {performer?.butt && (
                <Descriptions.Item label="Butt size">
                  {performer?.butt}
                </Descriptions.Item>
              )}
              {performer?.breastSize && (
                <Descriptions.Item label="Boobs">
                  {changeText(performer?.breastSize)}
                </Descriptions.Item>
              )}
            </Descriptions>
            {/* <Descriptions className="performer-info">
              {this.detectURLs(performer?.twitterUrl) && (
                <Descriptions.Item label="Twitter">
                  <a href={performer?.twitterUrl} target="_blank" rel="noreferrer">
                    {performer?.twitterUrl}
                  </a>
                </Descriptions.Item>
              )}
              {this.detectURLs(performer?.instagramUrl) && (
                <Descriptions.Item label="Instagram">
                  <a href={performer?.instagramUrl} target="_blank" rel="noreferrer">
                    {performer?.instagramUrl}
                  </a>
                </Descriptions.Item>
              )}
              {this.detectURLs(performer?.websiteUrl) && (
                <Descriptions.Item label="Website">
                  <a href={performer?.websiteUrl} target="_blank" rel="noreferrer">
                    {performer?.websiteUrl}
                  </a>
                </Descriptions.Item>
              )}
            </Descriptions> */}
          </Collapse.Panel>
        </Collapse>
      </div>
    );
  }
}
