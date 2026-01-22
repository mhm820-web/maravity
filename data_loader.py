# -*- coding: utf-8 -*-
"""
데이터 로더 모듈
Excel 파일에서 단어장 데이터를 로드합니다.
"""

import pandas as pd
import os

EXCEL_FILE_PATH = 'data/단어장 레벨.xlsx'

# 레벨 이름 매핑 (시트명 -> 표시 이름)
LEVEL_NAMES = {
    'BRIDGE_단어장': 'BRIDGE (입문)',
    'JP_단어장': 'JP (초급)',
    'PJ_단어장': 'PJ (초중급)',
    'KWLE_단어장': 'KWLE (중급)',
    'LS_단어장': 'LS (중상급)',
    'LT_단어장': 'LT (고급)'
}


def load_vocabulary_data():
    """
    Excel 파일에서 모든 레벨의 단어 데이터를 로드합니다.
    
    Returns:
        dict: {레벨명: [{'no': 번호, 'word': 영단어, 'meaning': 뜻}, ...]}
    """
    if not os.path.exists(EXCEL_FILE_PATH):
        raise FileNotFoundError(f"파일을 찾을 수 없습니다: {EXCEL_FILE_PATH}")
    
    xls = pd.ExcelFile(EXCEL_FILE_PATH)
    vocabulary_data = {}
    
    for sheet_name in xls.sheet_names:
        df = pd.read_excel(EXCEL_FILE_PATH, sheet_name=sheet_name)
        
        # 필요한 컬럼만 추출 (No., 단어, 뜻)
        df_clean = df[['No.', '단어', '뜻']].copy()
        df_clean.columns = ['no', 'word', 'meaning']
        
        # NaN 값 제거
        df_clean = df_clean.dropna()
        
        # 딕셔너리 리스트로 변환
        words_list = df_clean.to_dict('records')
        
        vocabulary_data[sheet_name] = words_list
    
    return vocabulary_data


def get_level_list():
    """
    사용 가능한 레벨 목록을 반환합니다.
    
    Returns:
        list: [{'id': 시트명, 'name': 표시명, 'count': 단어수}, ...]
    """
    data = load_vocabulary_data()
    levels = []
    
    for sheet_name, words in data.items():
        levels.append({
            'id': sheet_name,
            'name': LEVEL_NAMES.get(sheet_name, sheet_name),
            'count': len(words)
        })
    
    return levels


def get_words_by_level(level_id, count=10):
    """
    특정 레벨에서 지정된 개수의 단어를 랜덤으로 반환합니다.
    
    Args:
        level_id (str): 레벨 ID (시트명)
        count (int): 반환할 단어 개수
    
    Returns:
        list: 랜덤하게 선택된 단어 리스트
    """
    import random
    
    data = load_vocabulary_data()
    
    if level_id not in data:
        raise ValueError(f"존재하지 않는 레벨입니다: {level_id}")
    
    words = data[level_id]
    
    # 요청 개수가 전체 단어 수보다 많으면 전체 반환
    if count >= len(words):
        selected = words.copy()
    else:
        selected = random.sample(words, count)
    
    random.shuffle(selected)
    return selected


if __name__ == '__main__':
    # 테스트
    print("=== 레벨 목록 ===")
    levels = get_level_list()
    for level in levels:
        print(f"  {level['name']}: {level['count']}개 단어")
    
    print("\n=== BRIDGE 레벨 샘플 (5개) ===")
    sample = get_words_by_level('BRIDGE_단어장', 5)
    for word in sample:
        print(f"  {word['word']} - {word['meaning']}")
