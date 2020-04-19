import { Avatar } from 'antd'
import React from 'react'
import moment from 'moment'
import styles from './index.less'
import { router } from 'umi'

declare interface ArticleListContentProps {
	data: any
}

const ArticleListContent: React.FC<ArticleListContentProps> = ({
	data: { text, createdAt, avatar, writtenBy, profileUrl },
}) => (
	<div className={styles.listContent}>
		<div className={styles.description}>{text}</div>
		<div className={styles.extra}>
			<Avatar src={avatar} size="small" />
			<a onClick={(): void => router.push(`/user/${writtenBy}`)}>
				{writtenBy}
			</a> posted at {moment(createdAt).format('YYYY-MM-DD HH:mm')}
		</div>
	</div>
)

export default ArticleListContent