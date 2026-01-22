# -*- coding: utf-8 -*-
"""
데이터 로더 모듈
Excel 파일에서 단어장 데이터를 로드합니다.
2000개까지 확장 지원 (인접 레벨 단어 병합)
"""

import pandas as pd
import os
import random

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

# 레벨 순서 (비슷한 레벨 찾기용)
LEVEL_ORDER = [
    'BRIDGE_단어장',
    'JP_단어장', 
    'PJ_단어장',
    'KWLE_단어장',
    'LS_단어장',
    'LT_단어장'
]


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


def get_adjacent_levels(level_id):
    """
    주어진 레벨과 인접한 레벨들을 반환합니다.
    
    Args:
        level_id: 기준 레벨 ID
    
    Returns:
        list: 인접 레벨 ID 리스트 (가까운 순서)
    """
    if level_id not in LEVEL_ORDER:
        return []
    
    idx = LEVEL_ORDER.index(level_id)
    adjacent = []
    
    # 인접 레벨을 가까운 순서대로 추가
    for distance in range(1, len(LEVEL_ORDER)):
        # 아래 레벨
        if idx - distance >= 0:
            adjacent.append(LEVEL_ORDER[idx - distance])
        # 위 레벨
        if idx + distance < len(LEVEL_ORDER):
            adjacent.append(LEVEL_ORDER[idx + distance])
    
    return adjacent


def get_words_by_level(level_id, count=1000):
    """
    특정 레벨에서 지정된 개수의 단어를 반환합니다.
    1000개 이상 요청 시 인접 레벨에서 추가 단어를 가져옵니다.
    
    Args:
        level_id (str): 레벨 ID (시트명)
        count (int): 반환할 단어 개수 (최대 2000)
    
    Returns:
        list: 단어 리스트
    """
    data = load_vocabulary_data()
    
    if level_id not in data:
        raise ValueError(f"존재하지 않는 레벨입니다: {level_id}")
    
    # 기본 레벨 단어 가져오기
    words = data[level_id].copy()
    
    # 요청 개수가 기본 레벨 단어 수보다 많으면 인접 레벨에서 추가
    if count > len(words):
        needed = count - len(words)
        adjacent_levels = get_adjacent_levels(level_id)
        
        # 이미 포함된 단어들의 영단어 집합 (중복 방지)
        existing_words = set(w['word'].lower() for w in words)
        
        for adj_level in adjacent_levels:
            if needed <= 0:
                break
            
            adj_words = data.get(adj_level, [])
            
            for word in adj_words:
                if word['word'].lower() not in existing_words:
                    words.append(word)
                    existing_words.add(word['word'].lower())
                    needed -= 1
                    
                    if needed <= 0:
                        break
    
    # 요청된 개수만큼 자르기
    if len(words) > count:
        words = words[:count]
    
    # 순서 유지 (셔플 제거)
    return words


if __name__ == '__main__':
    # 테스트
    print("=== 레벨 목록 ===")
    levels = get_level_list()
    for level in levels:
        print(f"  {level['name']}: {level['count']}개 단어")
    
    print("\n=== BRIDGE 레벨 확장 테스트 (1500개) ===")
    sample = get_words_by_level('BRIDGE_단어장', 1500)
    print(f"  총 {len(sample)}개 단어 로드됨")
