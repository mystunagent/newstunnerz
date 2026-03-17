import { Tag, Button } from 'antd';
import { IPerformer } from 'src/interfaces';
import moment from 'moment';

interface IProps {
  performer: IPerformer;
  loadOndatoData: Function;
  loading: boolean;
}

const PerformerOndatoDocument = ({ performer, loadOndatoData, loading }: IProps) => {
  const { ondatoMetadata } = performer;
  const status = !!(ondatoMetadata?.status?.includes('Approved'));
  return (
    <div>
      <h2>Confirm document via Ondato</h2>
      <p>
        Application ID:
        {' '}
        <strong>{ondatoMetadata?.applicationId || 'N/A'}</strong>
      </p>
      <p>
        KYC ID:
        {' '}
        <strong>{ondatoMetadata?.id || 'N/A'}</strong>
      </p>
      <p>
        Identity verification ID:
        {' '}
        <strong>{ondatoMetadata?.identityVerificationId || 'N/A'}</strong>
      </p>
      <p>
        Created at:
        {' '}
        <strong>
          {ondatoMetadata?.createdUtc
            ? moment(ondatoMetadata?.createdUtc).format('MMMM DD, YYYY - hh:mm') : 'N/A'}
        </strong>
      </p>
      <p>
        Status:
        {' '}
        <Tag color={status ? 'success' : 'error'}>
          {status ? 'Approved' : 'Rejected'}
        </Tag>
      </p>
      <Button type="primary" onClick={loadOndatoData.bind(this)} disabled={loading} loading={loading}>
        Reload Ondato data
      </Button>
    </div>
  );
};

export default PerformerOndatoDocument;
